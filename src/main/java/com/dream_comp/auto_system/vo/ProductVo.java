package com.dream_comp.auto_system.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProductVo {
    private Long prodNum;
    private String prodCode;
    private String prodCategory;
    private String prodName;
    private Integer prodPrice;
    private String manufacturer;
    private Integer prodStatus;
    private LocalDateTime regDate;
}
