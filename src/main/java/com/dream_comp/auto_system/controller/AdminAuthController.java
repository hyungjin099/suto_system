package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.AdminLoginDto;
import com.dream_comp.auto_system.dto.AdminUserDto;
import com.dream_comp.auto_system.mapper.OrderMapper;
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
    private final OrderMapper orderMapper;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody AdminLoginDto dto,
                                                     HttpServletRequest req) {
        AdminUserDto user = adminUserService.authenticate(dto.getUsername(), dto.getPassword());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "아이디 또는 비밀번호가 올바르지 않습니다"));
        }

        // 첫 로그인 자가치유: LAST_SEEN_ORDER_NUM이 NULL이면 지금의 maxOrderNum으로 보정
        if (user.getLastSeenOrderNum() == null) {
            Integer maxOrderNum = orderMapper.findMaxOrderNum();
            int initValue = maxOrderNum != null ? maxOrderNum : 0;
            adminUserService.initializeLastSeen(user.getAdminNum(), initValue);
            user.setLastSeenOrderNum(initValue);
        }

        HttpSession old = req.getSession(false);
        if (old != null) old.invalidate();
        HttpSession session = req.getSession(true);
        session.setAttribute(SESSION_ADMIN, user);
        session.setMaxInactiveInterval(60 * 60 * 2); // 2시간

        return ResponseEntity.ok(sessionPayload(user, true));
    }

    /** 본인의 LAST_SEEN_ORDER_NUM 갱신 (OrderAdmin 진입 시 등). 역전 방지는 Mapper에서. */
    @PatchMapping("/me/last-seen")
    public ResponseEntity<Map<String, Object>> patchLastSeen(@RequestBody Map<String, Object> body,
                                                             HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        AdminUserDto user = session == null ? null : (AdminUserDto) session.getAttribute(SESSION_ADMIN);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "관리자 로그인이 필요합니다"));
        }
        Object v = body.get("orderNum");
        if (!(v instanceof Number)) {
            return ResponseEntity.badRequest().body(Map.of("message", "orderNum이 필요합니다"));
        }
        int orderNum = ((Number) v).intValue();
        adminUserService.updateLastSeenOrderNum(user.getAdminNum(), orderNum);
        // 세션 반영 (역전 방지 전제: 현재 세션값보다 큰 경우만 반영)
        Integer cur = user.getLastSeenOrderNum();
        if (cur == null || cur < orderNum) {
            user.setLastSeenOrderNum(orderNum);
            session.setAttribute(SESSION_ADMIN, user);
        }
        return ResponseEntity.ok(Map.of("ok", true, "lastSeenOrderNum", user.getLastSeenOrderNum()));
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
        return ResponseEntity.ok(sessionPayload(user, false));
    }

    /** 본인 비밀번호 변경 (로그인 상태에서 호출). 성공 시 세션의 상태도 갱신 */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> body,
                                                              HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        AdminUserDto user = session == null ? null : (AdminUserDto) session.getAttribute(SESSION_ADMIN);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "관리자 로그인이 필요합니다"));
        }
        try {
            AdminUserDto updated = adminUserService.changeOwnPassword(
                    user.getAdminNum(), body.get("currentPassword"), body.get("newPassword"));
            session.setAttribute(SESSION_ADMIN, updated);
            return ResponseEntity.ok(sessionPayload(updated, false));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    private Map<String, Object> sessionPayload(AdminUserDto user, boolean ok) {
        Map<String, Object> body = new HashMap<>();
        if (ok) body.put("ok", true);
        body.put("authenticated", true);
        body.put("username", user.getUsername());
        body.put("displayName", user.getDisplayName());
        body.put("mustChangePassword", "Y".equalsIgnoreCase(user.getPasswordResetRequired()));
        body.put("isSuperAdmin", AdminUserService.isSuperAdmin(user));
        body.put("lastSeenOrderNum", user.getLastSeenOrderNum());
        return body;
    }
}
