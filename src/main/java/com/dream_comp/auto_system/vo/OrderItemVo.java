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
    private Integer unitPrice;   // 가격 스냅샷
    private String aliasName;    // 별칭 스냅샷
}
