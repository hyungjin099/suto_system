package com.dream_comp.auto_system.dto;

import lombok.Data;

@Data
public class ProductRequestDto {
    private String prodCode;
    private String prodName;
    private Integer prodPrice;
    private String manufacturer;
}
