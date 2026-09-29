package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.AdminUserDto;
import com.dream_comp.auto_system.service.AdminUserService;
import com.dream_comp.auto_system.service.SystemSettingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** 시스템 설정 조회/수정 (최고 관리자 admin 계정만 접근) */
@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService settingService;

    @GetMapping
    public ResponseEntity<?> list(HttpServletRequest req) {
        ResponseEntity<?> denied = requireSuperAdmin(req);
        if (denied != null) return denied;
        return ResponseEntity.ok(Map.of(
                "items", settingService.listAll(),
                "currentPeriod", SystemSettingService.currentPeriod(),
                "currentWebhookKey", SystemSettingService.currentWebhookKey()
        ));
    }

    /** body: { "value": "..." } */
    @PutMapping("/{key}")
    public ResponseEntity<?> update(@PathVariable String key,
                                    @RequestBody Map<String, String> body,
                                    HttpServletRequest req) {
        ResponseEntity<?> denied = requireSuperAdmin(req);
        if (denied != null) return denied;

        String value = body.get("value");
        AdminUserDto user = (AdminUserDto) req.getSession(false).getAttribute(AdminAuthController.SESSION_ADMIN);
        settingService.set(key, value, user.getUsername());
        return ResponseEntity.ok(Map.of("ok", true, "key", key));
    }

    private ResponseEntity<?> requireSuperAdmin(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        AdminUserDto user = session == null
                ? null
                : (AdminUserDto) session.getAttribute(AdminAuthController.SESSION_ADMIN);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "관리자 로그인이 필요합니다"));
        }
        if (!AdminUserService.isSuperAdmin(user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "최고 관리자만 접근할 수 있습니다"));
        }
        return null;
    }
}
