package com.dream_comp.auto_system.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClientVo {
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
