package com.dream_comp.auto_system.dto;

import lombok.Data;

/** 관리자 페이지용 별칭 정보 (PK 포함, 원단 마스터 메타 포함) */
@Data
public class ClientAliasAdminDto {
    private Long aliasNum;
    private Long cliNum;
    private Long prodNum;
    private String prodCode;
    private String prodName;
    private String clientFabName;
    private Integer clientFabPrice;
}
