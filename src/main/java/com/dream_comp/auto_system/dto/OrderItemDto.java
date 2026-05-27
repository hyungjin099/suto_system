package com.dream_comp.auto_system.dto;

import lombok.Data;

@Data
public class OrderItemDto {
    private String product;       // 제품 코드 (ex. "stretch")
    private String productLabel;  // 제품 표시명 (ex. "스트레치 필름")
    private int width;            // 폭 (mm)
    private int length;           // 길이 (m)
    private int rolls;            // 롤수
}
