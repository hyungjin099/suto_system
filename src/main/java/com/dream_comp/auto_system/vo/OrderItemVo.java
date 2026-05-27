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
}
