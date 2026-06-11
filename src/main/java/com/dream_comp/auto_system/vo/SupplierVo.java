package com.dream_comp.auto_system.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SupplierVo {
    private Long supNum;
    private String supName;
    private String supTel;
    private String supManagerName;
    private String supManagerTel;
    private Integer supStatus;
    private LocalDateTime regDate;
}
