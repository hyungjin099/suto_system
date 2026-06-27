package com.dream_comp.auto_system.dto;

import lombok.Data;

@Data
public class AdminUserDto {
    private Long adminNum;
    private String username;
    private String password; // BCrypt 해시 — 응답에는 절대 노출 금지
    private String displayName;
}
