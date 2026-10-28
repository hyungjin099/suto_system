package com.dream_comp.auto_system.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/** 관리자 목록/상세용 */
@Data
public class PopupDto {
    private Long popupNum;
    private String title;
    private String content;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String useYn;
    private String targetAll;
    private Integer contentVer;
    private LocalDateTime createdAt;
    private List<String> cliCodes;   // targetAll='N' 일 때의 대상 거래처코드
}
