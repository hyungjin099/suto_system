package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.service.SheetsWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    @Value("${sheets.webhook.url}")
    private String webhookUrl;

    private final SheetsWebhookService sheetsWebhookService;

    @GetMapping("/sheets")
    public ResponseEntity<Map<String, String>> testSheets() {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("configuredUrl", webhookUrl);
        result.put("webhookResult", sheetsWebhookService.pingTest());
        return ResponseEntity.ok(result);
    }
}
