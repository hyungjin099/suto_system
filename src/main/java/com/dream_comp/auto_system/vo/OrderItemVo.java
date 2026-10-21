package com.dream_comp.auto_system.vo;

import lombok.Data;

@Data
public class OrderItemVo {
    private Long itemNum;
    private Long orderNum;
    private String product;
    private String productLabel;
    private int width;
    private int length;
    private int rolls;
    private String destination;
    private String note;
    private String deliveryDate; // 납품예정일 override (NULL이면 발주일 기준 자동계산). resultMap이 이 필드로 매핑하므로 반드시 필요
    private Integer unitPrice;   // 가격 스냅샷
    private String aliasName;    // 별칭 스냅샷
}
