package com.dream_comp.auto_system.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AdminAuthInterceptor adminAuthInterceptor;

    /** 콤마 구분으로 여러 오리진 허용 가능 (예: http://localhost:5173,https://app.example.com) */
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOriginsCsv;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOriginsCsv.split("\\s*,\\s*"))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true); // 세션 쿠키 사용을 위해 필수
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminAuthInterceptor)
                .addPathPatterns("/api/**")
                // === 공개 엔드포인트 (관리자 인증 없이 호출 가능) ===
                .excludePathPatterns(
                        // 관리자 인증 자체
                        "/api/admin/auth/**",
                        // 고객 주문 폼
                        "/api/orders",
                        "/api/clients/*/info",
                        "/api/clients/*/login",
                        "/api/clients/*/password",
                        "/api/clients/*/fabrics",
                        "/api/clients/*/orders",
                        "/api/clients/*/destinations"
                );
    }
}
