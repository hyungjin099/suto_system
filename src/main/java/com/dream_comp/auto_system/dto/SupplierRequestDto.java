package com.dream_comp.auto_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SupplierRequestDto {

    @NotBlank(message = "매입처명을 입력해 주세요")
    @Size(max = 100, message = "매입처명은 100자 이내여야 합니다")
    private String supName;
}
