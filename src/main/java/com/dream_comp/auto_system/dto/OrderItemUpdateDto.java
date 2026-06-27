package com.dream_comp.auto_system.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OrderItemUpdateDto {
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
    private LocalDateTime orderDate;
}
