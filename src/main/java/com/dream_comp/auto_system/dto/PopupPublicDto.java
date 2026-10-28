package com.dream_comp.auto_system.dto;

import lombok.Data;

/** 고객 주문 페이지에 내려주는 팝업 (노출 대상 1건) */
@Data
public class PopupPublicDto {
    private Long popupNum;
    private String title;
    private String content;
    private Integer contentVer;
}
