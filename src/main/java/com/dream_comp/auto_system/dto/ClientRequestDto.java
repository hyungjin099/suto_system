package com.dream_comp.auto_system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClientRequestDto {

    @NotBlank(message = "거래처코드를 입력해 주세요")
    @Pattern(regexp = "^\\d{8,12}$", message = "거래처코드는 숫자 8~12자리여야 합니다")
    private String cliCode;

    @NotBlank(message = "거래처명을 입력해 주세요")
    @Size(max = 100, message = "거래처명은 100자 이내여야 합니다")
    private String cliCompName;

    @Size(max = 50, message = "대표자명은 50자 이내여야 합니다")
    private String cliCeoName;

    // 전화/Fax/담당자 모바일은 반드시 '-' 포함 (숫자와 '-'만 허용)
    @Pattern(regexp = "^$|^[0-9]+(-[0-9]+)+$",
             message = "전화는 숫자와 '-'로 입력해 주세요 (예: 02-555-1180)")
    private String cliTel;

    @Pattern(regexp = "^$|^[0-9]+(-[0-9]+)+$",
             message = "Fax는 숫자와 '-'로 입력해 주세요 (예: 02-555-1181)")
    private String cliFax;

    @Size(max = 50, message = "담당자명은 50자 이내여야 합니다")
    private String cliManagerName;

    @Pattern(regexp = "^$|^[0-9]+(-[0-9]+)+$",
             message = "담당자 모바일은 숫자와 '-'로 입력해 주세요 (예: 010-1234-5678)")
    private String cliManagerTel;

    @Email(message = "올바른 이메일 형식이 아닙니다")
    @Size(max = 100, message = "이메일은 100자 이내여야 합니다")
    private String cliEmail;

    @Size(max = 200, message = "주소는 200자 이내여야 합니다")
    private String cliAddress;

    @Size(max = 20)
    private String cliUseType;
}
