package com.dream_comp.auto_system.vo;

import lombok.Data;

@Data
public class OrderItemUpdateVo {
    private Long itemNum;
    private String product;
    private String productLabel;
    private Integer width;
    private Integer length;
    private Integer rolls;
    private String destination;
    private String note;
    private String deliveryDate;
    private Integer unitPrice;
    private String aliasName;
}
