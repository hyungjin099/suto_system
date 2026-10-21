package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.OrderItemDto;
import com.dream_comp.auto_system.dto.OrderRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SheetsWebhookService {

    private final ObjectMapper objectMapper;
    private final SystemSettingService settingService;

    // Apps Script Web App은 POST 시 302 리다이렉트를 반환하므로 ALWAYS 설정
    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    /** 현재 반기(1~6월=H1, 7~12월=H2)에 해당하는 웹훅 URL을 DB(SYSTEM_SETTING)에서 읽음 */
    private String currentWebhookUrl() {
        return settingService.get(SystemSettingService.currentWebhookKey());
    }

    private boolean isUnset(String url) {
        return url == null || url.isBlank() || url.contains("YOUR_DEPLOYMENT_ID");
    }

    /** 브라우저 진단용: webhook 호출 결과를 문자열로 반환 */
    public String pingTest() {
        String webhookUrl = currentWebhookUrl();
        if (isUnset(webhookUrl)) {
            return "SKIP: SHEETS_WEBHOOK_URL 미설정 (현재값=" + webhookUrl + ")";
        }
        try {
            String json = "{\"orderId\":\"TEST\",\"clientName\":\"테스트\",\"managerPhone\":\"010-0000-0000\","
                    + "\"destination\":\"테스트납품처\",\"orderDate\":\"2099-01-01 00:00:00\","
                    + "\"items\":[{\"productLabel\":\"테스트원단\",\"width\":1000,\"length\":500,\"rolls\":1}]}";

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .timeout(java.time.Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            return "HTTP " + res.statusCode() + " | " + res.body();
        } catch (Exception e) {
            return "ERROR: " + e.getClass().getSimpleName() + " - " + e.getMessage();
        }
    }

    /** 웹훅 호출 결과. success + Apps Script가 계산한 정확한 deliveryDate(있으면) */
    public static class PushResult {
        public final boolean success;
        public final String deliveryDate;
        public PushResult(boolean success, String deliveryDate) {
            this.success = success;
            this.deliveryDate = deliveryDate;
        }
    }

    public PushResult push(String orderId, OrderRequestDto dto, List<Long> itemNums) {
        return push(orderId, dto, itemNums, null);
    }

    /** orderDateOverride != null 이면 payload의 orderDate를 그 값으로 강제. (DeferredPushJob 등 지연 발송용) */
    public PushResult push(String orderId, OrderRequestDto dto, List<Long> itemNums,
                           LocalDateTime orderDateOverride) {
        String webhookUrl = currentWebhookUrl();
        if (isUnset(webhookUrl)) {
            log.warn("Sheets webhook URL 미설정 → 시트 전송 건너뜀 (orderId={})", orderId);
            return new PushResult(false, null);
        }

        try {
            Map<String, Object> payload = buildPayload(orderId, dto, itemNums);
            if (orderDateOverride != null) {
                payload.put("orderDate",
                        orderDateOverride.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            }
            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .timeout(java.time.Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            boolean ok = response.statusCode() >= 200 && response.statusCode() < 300;
            String deliveryDate = null;
            if (ok) {
                // Apps Script는 오류가 나도 HTTP 200 + {"status":"ERROR"}로 응답하므로 body의 status까지 확인
                try {
                    Map<?,?> body = objectMapper.readValue(response.body(), Map.class);
                    if (!"OK".equals(body.get("status"))) {
                        ok = false;
                        log.warn("Sheets push 거부됨 (orderId={}, body={})", orderId, response.body());
                    } else {
                        Object dd = body.get("deliveryDate");
                        if (dd instanceof String s && !s.isBlank()) deliveryDate = s;
                        log.info("Sheets push 완료 (orderId={}, status={}, body={})",
                                orderId, response.statusCode(), response.body());
                    }
                } catch (Exception e) {
                    // JSON이 아닌 응답(로그인 페이지 HTML 등)은 성공으로 볼 수 없음
                    ok = false;
                    log.warn("Sheets push 응답 파싱 실패 (orderId={}, body={})", orderId, response.body());
                }
            } else {
                log.warn("Sheets push 응답 오류 (orderId={}, status={}, body={})",
                        orderId, response.statusCode(), response.body());
            }
            return new PushResult(ok, deliveryDate);

        } catch (Exception e) {
            log.warn("Sheets push 실패 (orderId={}) → DB 저장은 유지됨: {}", orderId, e.getMessage());
            return new PushResult(false, null);
        }
    }

    private Map<String, Object> buildPayload(String orderId, OrderRequestDto dto, List<Long> itemNums) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", orderId);
        payload.put("cliCode", dto.getCliCode());
        payload.put("clientName",   dto.getClientName()   != null ? dto.getClientName()   : "");
        payload.put("managerPhone", dto.getManagerPhone() != null ? dto.getManagerPhone() : "");
        payload.put("orderDate",
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        List<Map<String, Object>> itemList = new ArrayList<>();
        for (int i = 0; i < dto.getItems().size(); i++) {
            OrderItemDto item = dto.getItems().get(i);
            Map<String, Object> row = new HashMap<>();
            // ★ 시트 P열 매칭용 itemNum
            if (itemNums != null && i < itemNums.size()) row.put("itemNum", itemNums.get(i));
            row.put("product", item.getProduct());
            row.put("productLabel", item.getProductLabel());
            row.put("width", item.getWidth());
            row.put("length", item.getLength());
            row.put("rolls", item.getRolls());
            row.put("destination", item.getDestination() != null ? item.getDestination() : "");
            row.put("note", item.getNote() != null ? item.getNote() : "");
            itemList.add(row);
        }
        payload.put("items", itemList);

        return payload;
    }
}
