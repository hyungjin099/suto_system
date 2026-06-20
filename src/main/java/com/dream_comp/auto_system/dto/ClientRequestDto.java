package com.dream_comp.auto_system.dto;

import lombok.Data;

@Data
public class ClientRequestDto {
    private String cliCode;
    private String cliCompName;
    private String cliCeoName;
    private String cliTel;
    private String cliFax;
    private String cliManagerName;
    private String cliManagerTel;
    private String cliEmail;
    private String cliAddress;
    private String cliUseType; // 수정 시에만 사용 (등록 시 DB DEFAULT 'YES')
}
