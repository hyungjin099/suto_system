package com.dream_comp.auto_system.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequestDto {
    private int urlNum;              // CLIENT_INFO.URL_NUM (URL 마지막 숫자)
    private String destination;      // 납품처 (선택)
    private String clientName;       // 주문처 회사명
    private String managerPhone;     // 담당자 연락처
    private List<OrderItemDto> items;
}
