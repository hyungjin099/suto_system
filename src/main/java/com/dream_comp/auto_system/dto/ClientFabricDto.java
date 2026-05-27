package com.dream_comp.auto_system.dto;

import lombok.Data;

@Data
public class ClientFabricDto {
    private String aliasName; // 고객사 호칭 (셀렉트박스 표시)
    private String prodCode;  // 공식 원단 코드 (DB·시트 저장)
    private String prodName;  // 공식 원단명 (DB·시트 저장)
}
