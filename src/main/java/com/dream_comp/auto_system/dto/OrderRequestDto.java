package com.dream_comp.auto_system.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class OrderRequestDto {

    @NotBlank(message = "거래처코드가 필요합니다")
    @Size(max = 20, message = "거래처코드는 20자 이내여야 합니다")
    private String cliCode;          // CLIENT_INFO.CLI_CODE

    @Size(max = 200)
    private String destination;

    @Size(max = 100)
    private String clientName;

    @Size(max = 20)
    private String managerPhone;

    @NotEmpty(message = "품목이 1개 이상이어야 합니다")
    @Size(max = 50, message = "한 번에 최대 50개 품목까지 주문할 수 있습니다")
    @Valid
    private List<OrderItemDto> items;
}
