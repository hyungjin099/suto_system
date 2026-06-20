package com.dream_comp.auto_system.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductRequestDto {

    @NotBlank(message = "제품코드를 입력해 주세요")
    @Size(max = 30, message = "제품코드는 30자 이내여야 합니다")
    private String prodCode;

    @NotBlank(message = "제품명을 입력해 주세요")
    @Size(max = 100, message = "제품명은 100자 이내여야 합니다")
    private String prodName;

    @Min(value = 0, message = "단가는 0 이상이어야 합니다")
    private Integer prodPrice; // NULL 허용 (선택 입력)

    @NotBlank(message = "매입처를 선택해 주세요")
    @Size(max = 50, message = "매입처는 50자 이내여야 합니다")
    private String manufacturer;
}
