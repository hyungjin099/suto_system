package com.dream_comp.auto_system.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** 신규 발주 알림 payload (SSE / unseen preview 공용) */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewOrderEventDto {
    private Integer orderNum;
    private String  orderId;
    private String  cliCompName;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime orderDate;
    private String  firstProductLabel;
    private Integer itemCount;
    private Integer totalRolls;
    /** 'PENDING' / 'OK' / 'FAILED' / 'DEFERRED' */
    private String  status;
}
