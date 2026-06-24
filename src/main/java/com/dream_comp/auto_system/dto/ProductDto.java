package com.dream_comp.auto_system.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProductDto {
    private Long prodNum;
    private String prodCode;
    private String prodName;
    private Integer prodPrice;
    private String manufacturer;
    private String prodStatus; // '사용' / '미사용'
    private LocalDateTime regDate;
}
