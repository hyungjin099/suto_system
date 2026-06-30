package com.dream_comp.auto_system.dto;

import lombok.Data;

/** 주문 페이지(공개)용 거래처 정보 — 민감 컬럼은 노출하지 않는다 */
@Data
public class ClientPublicDto {
    private String cliCode;
    private String cliCompName;
    private String cliManagerTel;
    private String cliUseType;
}
