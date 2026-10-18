package com.dream_comp.auto_system.dto;

import lombok.Data;

@Data
public class AdminUserDto {
    private Long adminNum;
    private String username;
    private String password; // BCrypt 해시 — 응답에는 절대 노출 금지
    private String displayName;
    private String passwordResetRequired; // 'Y'/'N'
    private String useYn;                 // 'Y'/'N'
    private Integer lastSeenOrderNum;     // 알림: 이 관리자가 마지막으로 본 ORDER_NUM. NULL이면 첫 로그인 시 보정
}
