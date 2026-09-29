package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.mapper.SystemSettingMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 관리자 페이지에서 편집 가능한 시스템 설정 저장소.
 * - 값은 SYSTEM_SETTING 테이블에 보관
 * - 조회 성능을 위해 in-memory 캐시 사용 (set() 호출 시 무효화)
 * - 부트스트랩 시, 아직 DB에 값이 없으면 application.properties의 기본값을 seed
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingService {

    /** 상반기(1~6월) 웹훅 URL */
    public static final String KEY_SHEETS_WEBHOOK_URL_H1 = "SHEETS_WEBHOOK_URL_H1";
    /** 하반기(7~12월) 웹훅 URL */
    public static final String KEY_SHEETS_WEBHOOK_URL_H2 = "SHEETS_WEBHOOK_URL_H2";

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** 현재 KST 기준 반기: 1~6월이면 H1, 7~12월이면 H2 */
    public static String currentPeriod() {
        int m = LocalDate.now(KST).getMonthValue();
        return (m <= 6) ? "H1" : "H2";
    }

    /** 현재 반기에 해당하는 웹훅 URL 키 */
    public static String currentWebhookKey() {
        return "H1".equals(currentPeriod()) ? KEY_SHEETS_WEBHOOK_URL_H1 : KEY_SHEETS_WEBHOOK_URL_H2;
    }

    private final SystemSettingMapper mapper;

    /** application.properties의 sheets.webhook.url — DB에 값이 없을 때만 seed용으로 사용 */
    @Value("${sheets.webhook.url:}")
    private String sheetsWebhookUrlFromProps;

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    /**
     * 앱 시작 후, 현재 반기 URL이 비어있고 application.properties/env에 값이 있으면 최초 1회 seed.
     * (env에 넣어둔 legacy 값을 현재 반기 슬롯으로 이관)
     */
    @EventListener(ApplicationReadyEvent.class)
    public void bootstrap() {
        String key = currentWebhookKey();
        String existing = mapper.findValue(key);
        if ((existing == null || existing.isBlank())
                && sheetsWebhookUrlFromProps != null && !sheetsWebhookUrlFromProps.isBlank()) {
            mapper.upsert(key, sheetsWebhookUrlFromProps.trim(), "bootstrap");
            log.info("SYSTEM_SETTING seeded {} from env (current period={})", key, currentPeriod());
        }
    }

    /** DB 조회 + 캐시. 값이 없으면 null */
    public String get(String key) {
        String v = cache.computeIfAbsent(key, k -> {
            String dbVal = mapper.findValue(k);
            return dbVal == null ? "" : dbVal;
        });
        return v.isBlank() ? null : v;
    }

    /** superadmin이 저장. 캐시 무효화 */
    public void set(String key, String value, String actor) {
        String normalized = value == null ? "" : value.trim();
        mapper.upsert(key, normalized, actor == null ? "-" : actor);
        cache.remove(key);
        log.info("SYSTEM_SETTING updated key={} by={}", key, actor);
    }

    /** 관리 화면 목록 조회 */
    public List<Map<String, Object>> listAll() {
        return mapper.findAll();
    }
}
