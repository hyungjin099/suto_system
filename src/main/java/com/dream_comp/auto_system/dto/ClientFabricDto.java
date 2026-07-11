package com.dream_comp.auto_system.dto;

import lombok.Data;

@Data
public class ClientFabricDto {
    private Long aliasNum;           // 별칭 PK (프론트 select의 유니크 키로 사용)
    private String aliasName;        // 고객사 호칭 (셀렉트박스 표시)
    private String prodCode;         // 공식 원단 코드
    private String prodName;         // 공식 원단명
    private Integer clientFabPrice;  // 고객사 적용 단가 (NULL 가능)
}
