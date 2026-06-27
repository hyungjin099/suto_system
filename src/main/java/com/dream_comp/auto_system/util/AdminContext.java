package com.dream_comp.auto_system.util;

import com.dream_comp.auto_system.controller.AdminAuthController;
import com.dream_comp.auto_system.dto.AdminUserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** 현재 요청의 관리자 username을 안전하게 꺼낸다. 없으면 null. */
public final class AdminContext {

    public static final String CUSTOMER_ACTOR = "CUSTOMER";

    private AdminContext() {}

    public static String currentUsername() {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;
        HttpServletRequest req = attrs.getRequest();
        HttpSession session = req.getSession(false);
        if (session == null) return null;
        Object o = session.getAttribute(AdminAuthController.SESSION_ADMIN);
        if (!(o instanceof AdminUserDto)) return null;
        return ((AdminUserDto) o).getUsername();
    }

    /** 관리자면 username, 아니면 'CUSTOMER' */
    public static String currentActor() {
        String u = currentUsername();
        return u == null ? CUSTOMER_ACTOR : u;
    }
}
