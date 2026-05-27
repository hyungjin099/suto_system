package com.dream_comp.auto_system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderResponseDto {
    private String orderId;
    private String status;
    private String message;
}
