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
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            return "HTTP " + res.statusCode() + " | " + res.body();
        } catch (Exception e) {
            return "ERROR: " + e.getClass().getSimpleName() + " - " + e.getMessage();
        }
    }

    public void push(String orderId, OrderRequestDto dto) {
        if (webhookUrl == null || webhookUrl.isBlank() || webhookUrl.contains("YOUR_DEPLOYMENT_ID")) {
            log.warn("Sheets webhook URL 미설정 → 시트 전송 건너뜀 (orderId={})", orderId);
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(buildPayload(orderId, dto));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Sheets push 완료 (orderId={}, status={}, body={})",
                        orderId, response.statusCode(), response.body());
            } else {
                log.warn("Sheets push 응답 오류 (orderId={}, status={}, body={})",
                        orderId, response.statusCode(), response.body());
            }

        } catch (Exception e) {
            // 흐름 B: 시트 push 실패해도 DB에는 이미 저장되어 있으므로 주문 유실 없음
            log.warn("Sheets push 실패 (orderId={}) → DB 저장은 유지됨: {}", orderId, e.getMessage());
        }
    }

    private Map<String, Object> buildPayload(String orderId, OrderRequestDto dto) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", orderId);
        payload.put("urlNum", dto.getUrlNum());
        payload.put("clientName",    dto.getClientName()    != null ? dto.getClientName()    : "");
        payload.put("managerPhone",  dto.getManagerPhone()  != null ? dto.getManagerPhone()  : "");
        payload.put("destination",   dto.getDestination()   != null ? dto.getDestination()   : "");
        payload.put("orderDate",
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        List<Map<String, Object>> itemList = new ArrayList<>();
        for (OrderItemDto item : dto.getItems()) {
            Map<String, Object> row = new HashMap<>();
            row.put("product", item.getProduct());
            row.put("productLabel", item.getProductLabel());
            row.put("width", item.getWidth());
            row.put("length", item.getLength());
            row.put("rolls", item.getRolls());
            itemList.add(row);
        }
        payload.put("items", itemList);

        return payload;
    }
}
