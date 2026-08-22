package com.dream_comp.auto_system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderResponseDto {
    private String orderId;
    private String status;
    private String message;
    private String deliveryDate;   // 'yyyy-MM-dd' 근사값 (주말만 스킵, 공휴일은 Apps Script가 별도 처리)
}
