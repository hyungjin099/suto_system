package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.AdminUserDto;
import com.dream_comp.auto_system.service.AdminUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** 관리자 계정 관리 (최고 관리자 admin 계정만 접근 허용) */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<?> list(HttpServletRequest req) {
        ResponseEntity<?> denied = requireSuperAdmin(req);
        if (denied != null) return denied;
        return ResponseEntity.ok(adminUserService.listAll());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body, HttpServletRequest req) {
        ResponseEntity<?> denied = requireSuperAdmin(req);
        if (denied != null) return denied;
        try {
            AdminUserDto created = adminUserService.createByAdmin(body.get("username"));
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    /** { "active": true | false } */
    @PatchMapping("/{adminNum}/active")
    public ResponseEntity<?> setActive(@PathVariable Long adminNum,
                                       @RequestBody Map<String, Object> body,
                                       HttpServletRequest req) {
        ResponseEntity<?> denied = requireSuperAdmin(req);
        if (denied != null) return denied;
        try {
            boolean active = Boolean.TRUE.equals(body.get("active"));
            return ResponseEntity.ok(adminUserService.setActive(adminNum, active));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
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

    /** 목록 응답 타입 힌트용 (JSON은 그대로 List<AdminUserDto>) */
    @SuppressWarnings("unused")
    private static class ListResp {
        public List<AdminUserDto> items;
    }
}
