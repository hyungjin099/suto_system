package com.dream_comp.auto_system.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClientAliasRequestDto {
    @NotNull(message = "거래처번호가 필요합니다")
    private Long cliNum;

    @NotNull(message = "원단번호가 필요합니다")
    private Long prodNum;

    @NotBlank(message = "별칭을 입력해 주세요")
    @Size(max = 100, message = "별칭은 100자 이내여야 합니다")
    private String clientFabName;

    @Min(value = 0, message = "단가는 0 이상이어야 합니다")
    private Integer clientFabPrice;
}
