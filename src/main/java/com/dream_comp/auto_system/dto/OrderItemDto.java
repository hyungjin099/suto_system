package com.dream_comp.auto_system.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OrderItemDto {

    @NotBlank(message = "제품코드가 필요합니다")
    @Size(max = 50)
    private String product;       // 제품 코드

    @Size(max = 100)
    private String productLabel;  // 제품 표시명

    @Min(value = 0, message = "폭은 0 이상이어야 합니다")
    @Max(value = 100000, message = "폭이 너무 큽니다")
    private int width;

    @Min(value = 0, message = "길이는 0 이상이어야 합니다")
    @Max(value = 100000, message = "길이가 너무 큽니다")
    private int length;

    @Min(value = 1, message = "롤수는 1 이상이어야 합니다")
    @Max(value = 10000, message = "롤수가 너무 큽니다")
    private int rolls;

    @Size(max = 500)
    private String destination;   // 아이템별 납품처

    @Size(max = 1000)
    private String note;          // 비고
}
