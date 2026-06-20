package com.dream_comp.auto_system.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClientDto {
    private Long cliNum;
    private String cliCode;
    private String cliCompName;
    private String cliCeoName;
    private String cliTel;
    private String cliFax;
    private String cliManagerName;
    private String cliManagerTel;
    private String cliEmail;
    private String cliAddress;
    private String cliUseType;
    private LocalDateTime joinDate;
}
