package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.OrderItemDto;
import com.dream_comp.auto_system.dto.OrderRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${sheets.webhook.url}")
    private String webhookUrl;

    private final ObjectMapper objectMapper;

    // Apps Script Web App은 POST 시 302 리다이렉트를 반환하므로 ALWAYS 설정
    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    /** 브라우저 진단용: webhook 호출 결과를 문자열로 반환 */
    public String pingTest() {
        if (webhookUrl == null || webhookUrl.isBlank() || webhookUrl.contains("YOUR_DEPLOYMENT_ID")) {
            return "SKIP: sheets.webhook.url 미설정 (현재값=" + webhookUrl + ")";
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
        if (webhookUrl == null || webhookUrl.isBlank() || webhookUrl.contains("YOUR_DEPLOYMENT_ID")) {
            log.warn("Sheets webhook URL 미설정 → 시트 전송 건너뜀 (orderId={})", orderId);
            return new PushResult(false, null);
        }

        try {
            String json = objectMapper.writeValueAsString(buildPayload(orderId, dto, itemNums));

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
                log.info("Sheets push 완료 (orderId={}, status={}, body={})",
                        orderId, response.statusCode(), response.body());
                // Apps Script 응답에서 정확한 납기예정일 파싱 (공휴일 반영된 값)
                try {
                    Map<?,?> body = objectMapper.readValue(response.body(), Map.class);
                    Object dd = body.get("deliveryDate");
                    if (dd instanceof String s && !s.isBlank()) deliveryDate = s;
                } catch (Exception ignored) {
                    // 응답 파싱 실패해도 push 자체는 성공 처리
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

    /** 시트의 행 삭제(비우기) 신호 */
    public boolean pushItemDelete(Long itemNum) {
        if (webhookUrl == null || webhookUrl.isBlank() || webhookUrl.contains("YOUR_DEPLOYMENT_ID")) {
            log.warn("Sheets webhook URL 미설정 → 삭제 동기화 건너뜀 (itemNum={})", itemNum);
            return false;
        }
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "delete");
            payload.put("itemNum", itemNum);
            String json = objectMapper.writeValueAsString(payload);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .timeout(java.time.Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            log.info("Sheets delete push (itemNum={}, http={}, body={})",
                    itemNum, res.statusCode(), res.body());
            return res.statusCode() >= 200 && res.statusCode() < 300;
        } catch (Exception e) {
            log.warn("Sheets delete push 실패 (itemNum={}): {}", itemNum, e.getMessage());
            return false;
        }
    }

    /** 시트의 기존 행을 itemNum 기준으로 찾아 갱신하라는 신호 */
    public boolean pushItemUpdate(com.dream_comp.auto_system.dto.AdminOrderRowDto row) {
        if (webhookUrl == null || webhookUrl.isBlank() || webhookUrl.contains("YOUR_DEPLOYMENT_ID")) {
            log.warn("Sheets webhook URL 미설정 → 수정 동기화 건너뜀 (itemNum={})", row.getItemNum());
            return false;
        }
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "update");
            payload.put("itemNum", row.getItemNum());
            payload.put("orderId", row.getOrderId());
            payload.put("orderDate", row.getOrderDate() == null ? "" :
                    row.getOrderDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            payload.put("product", row.getProduct());
            payload.put("productLabel", row.getProductLabel());
            payload.put("width", row.getWidth());
            payload.put("length", row.getLength());
            payload.put("rolls", row.getRolls());
            payload.put("clientName", row.getCliCompName());
            payload.put("destination", row.getDestination());
            payload.put("note", row.getNote());
            // 사용자가 직접 수정한 납품예정일 (null이면 시트에서 자동계산)
            payload.put("deliveryDate", row.getDeliveryDate());

            String json = objectMapper.writeValueAsString(payload);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .timeout(java.time.Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            boolean ok = res.statusCode() >= 200 && res.statusCode() < 300;
            log.info("Sheets update push (itemNum={}, http={}, body={})",
                    row.getItemNum(), res.statusCode(), res.body());
            return ok;
        } catch (Exception e) {
            log.warn("Sheets update push 실패 (itemNum={}): {}", row.getItemNum(), e.getMessage());
            return false;
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
