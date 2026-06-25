package com.dream_comp.auto_system.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OrderItemUpdateDto {
    private String product;        // 제품코드
    private String productLabel;   // 제품명
    private Integer width;
    private Integer length;
    private Integer rolls;
    private String destination;
    private String note;
    private String deliveryDate;     // 납품예정일 (사용자 수정값. null이면 시트에서 자동 재계산)
    private LocalDateTime orderDate; // 부모 ORDER_INFO.ORDER_DATE도 함께 수정 가능 (선택)
}
