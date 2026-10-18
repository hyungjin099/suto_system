package com.dream_comp.auto_system.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 공휴일 캐시. Apps Script Web App을 단일 공휴일 소스로 사용.
 *
 * - 데이터 소스: Apps Script (내부적으로 공공데이터포털 API 호출 + 임시공휴일 수동 추가 반영)
 * - 캐시 전략: 서버 시작 직후 1회 + 매일 00:30 KST 재조회
 * - API 호출 실패 시: 기존 캐시 유지 (운영 중 공휴일 조회 끊김 방지)
 * - 미초기화/실패 상태: 비어있는 Set → isHoliday() 는 모두 false 반환 (주말만 체크)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HolidayService {

    private final SystemSettingService settingService;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /** yyyy-MM-dd 포맷의 공휴일 Set */
    private final Set<String> holidays = ConcurrentHashMap.newKeySet();
    private volatile boolean initialized = false;

    @EventListener(ApplicationReadyEvent.class)
    public void initOnStartup() {
        refresh();
    }

    /** 매일 00:30 KST 공휴일 재조회 */
    @Scheduled(cron = "0 30 0 * * *", zone = "Asia/Seoul")
    public void dailyRefresh() {
        refresh();
    }

    public void refresh() {
        String webhookUrl = settingService.get(SystemSettingService.currentWebhookKey());
        if (webhookUrl == null || webhookUrl.isBlank() || webhookUrl.contains("YOUR_DEPLOYMENT_ID")) {
            log.warn("HolidayService — webhook URL 미설정, 공휴일 조회 skip");
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(Map.of("action", "holidays"));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() < 200 || res.statusCode() >= 300) {
                log.warn("HolidayService — Apps Script 응답 오류 status={}", res.statusCode());
                return;
            }
            Map<?, ?> body = objectMapper.readValue(res.body(), Map.class);
            Object list = body.get("holidays");
            if (!(list instanceof List)) {
                log.warn("HolidayService — 응답 형식 오류: {}", res.body());
                return;
            }
            Set<String> next = ConcurrentHashMap.newKeySet();
            for (Object item : (List<?>) list) {
                if (item == null) continue;
                String s = item.toString().trim();
                if (!s.isEmpty()) next.add(s);
            }
            holidays.clear();
            holidays.addAll(next);
            initialized = true;
            log.info("HolidayService — 공휴일 {}건 로드 완료", holidays.size());
        } catch (Exception e) {
            log.warn("HolidayService — 공휴일 조회 실패: {}", e.getMessage());
        }
    }

    public boolean isHoliday(LocalDate date) {
        if (date == null) return false;
        return holidays.contains(date.toString());
    }

    /** 현재 캐시된 공휴일 전체 (디버그·관리자 조회용) */
    public Set<String> currentHolidays() {
        return Collections.unmodifiableSet(holidays);
    }

    public boolean isInitialized() { return initialized; }
}
