package com.dream_comp.auto_system.config;

import com.dream_comp.auto_system.controller.AdminAuthController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** /api/admin/** 경로(인증 엔드포인트 제외)에 들어가는 모든 요청에 관리자 세션 필요 */
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) return true; // CORS preflight
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute(AdminAuthController.SESSION_ADMIN) == null) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"message\":\"관리자 로그인이 필요합니다\"}");
            return false;
        }
        return true;
    }
}
