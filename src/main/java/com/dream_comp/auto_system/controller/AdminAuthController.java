package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.AdminLoginDto;
import com.dream_comp.auto_system.dto.AdminUserDto;
import com.dream_comp.auto_system.service.AdminUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    public static final String SESSION_ADMIN = "ADMIN_USER";

    private final AdminUserService adminUserService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody AdminLoginDto dto,
                                                     HttpServletRequest req) {
        AdminUserDto user = adminUserService.authenticate(dto.getUsername(), dto.getPassword());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "아이디 또는 비밀번호가 올바르지 않습니다"));
        }
        // 세션 고정 공격 방지: 기존 세션 무효화 후 새로 생성
        HttpSession old = req.getSession(false);
        if (old != null) old.invalidate();
        HttpSession session = req.getSession(true);
        session.setAttribute(SESSION_ADMIN, user);
        session.setMaxInactiveInterval(60 * 60 * 2); // 2시간

        Map<String, Object> body = new HashMap<>();
        body.put("ok", true);
        body.put("username", user.getUsername());
        body.put("displayName", user.getDisplayName());
        return ResponseEntity.ok(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** 현재 로그인 여부 확인 — 프론트의 AdminGuard에서 호출 */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        AdminUserDto user = session == null ? null : (AdminUserDto) session.getAttribute(SESSION_ADMIN);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("authenticated", false));
        }
        Map<String, Object> body = new HashMap<>();
        body.put("authenticated", true);
        body.put("username", user.getUsername());
        body.put("displayName", user.getDisplayName());
        return ResponseEntity.ok(body);
    }
}
