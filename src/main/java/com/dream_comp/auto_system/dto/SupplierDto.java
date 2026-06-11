package com.dream_comp.auto_system.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SupplierDto {
    private Long supNum;
    private String supName;
    private String supTel;
    private String supManagerName;
    private String supManagerTel;
    private LocalDateTime regDate;
}
