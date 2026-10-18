package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.NewOrderEventDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 관리자 알림용 SSE 브로드캐스터.
 *
 * - 관리자 1명이 여러 탭을 열 수 있으므로 UUID 키로 Emitter 저장
 * - broadcastNewOrder() 시 모든 활성 Emitter에 전송
 * - 30초마다 heartbeat (comment)로 프록시 timeout 방지
 * - send 실패하면 그 Emitter 즉시 제거
 */
@Slf4j
@Service
public class SseBroadcaster {

    /** 24시간을 timeout으로 — EventSource 자동 재연결 활용 */
    private static final long EMITTER_TIMEOUT_MS = 24L * 60 * 60 * 1000;

    /** emitterId(UUID) → Emitter */
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long adminNum) {
        String id = adminNum + ":" + UUID.randomUUID();
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.put(id, emitter);

        emitter.onCompletion(() -> {
            emitters.remove(id);
            log.debug("SSE 완료: {}", id);
        });
        emitter.onTimeout(() -> {
            emitters.remove(id);
            log.debug("SSE 타임아웃: {}", id);
        });
        emitter.onError(e -> {
            emitters.remove(id);
            log.debug("SSE 오류 ({}): {}", id, e.getMessage());
        });

        // 최초 연결 확인용 ping
        try {
            emitter.send(SseEmitter.event().name("ready").data(Map.of("ok", true)));
        } catch (IOException e) {
            emitters.remove(id);
        }
        log.info("SSE 구독 시작 — adminNum={}, id={}, 총 active={}", adminNum, id, emitters.size());
        return emitter;
    }

    public void broadcastNewOrder(NewOrderEventDto event) {
        if (emitters.isEmpty()) return;
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(SseEmitter.event().name("new-order").data(event));
            } catch (Exception ex) {
                log.debug("SSE 전송 실패 → 제거 ({}): {}", id, ex.getMessage());
                emitters.remove(id);
                try { emitter.complete(); } catch (Exception ignored) {}
            }
        });
    }

    /** 30초마다 heartbeat (comment 라인) — 프록시/로드밸런서 timeout 방지 */
    @Scheduled(fixedDelay = 30_000L)
    public void heartbeat() {
        if (emitters.isEmpty()) return;
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (Exception ex) {
                emitters.remove(id);
                try { emitter.complete(); } catch (Exception ignored) {}
            }
        });
    }

    public int activeCount() { return emitters.size(); }
}
