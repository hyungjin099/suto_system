package com.dream_comp.auto_system.dto;

import lombok.Data;
import java.time.LocalDateTime;

/** 관리자 주문 내역: 품목 1행씩 펼친 평면 구조 (스프레드시트와 매핑) */
@Data
public class AdminOrderRowDto {
    private Long orderNum;
    private Long itemNum;
    private String orderId;
    private LocalDateTime orderDate;
    private String status;          // 'PENDING' | 'OK' | 'FAILED' → 시트 전송 상태
    private String cliCode;
    private String cliCompName;     // 발주처
    private String product;         // 제품코드
    private String productLabel;    // 제품명
    private Integer width;
    private Integer length;
    private Integer rolls;
    private String destination;     // 납품처
    private String note;            // 비고
    private String deliveryDate;    // 납품예정일 (override, null이면 시트에서 자동계산)
    private Integer unitPrice;      // 단가 스냅샷
    private String aliasName;       // 별칭 스냅샷
}
