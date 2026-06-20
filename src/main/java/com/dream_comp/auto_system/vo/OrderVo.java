package com.dream_comp.auto_system.vo;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderVo {
    private Long orderNum;
    private String cliCode;
    private String orderId;
    private String destination;
    private String status;
    private LocalDateTime orderDate;
    private List<OrderItemVo> items;
}
