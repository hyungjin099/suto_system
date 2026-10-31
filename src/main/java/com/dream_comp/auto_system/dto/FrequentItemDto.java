package com.dream_comp.auto_system.dto;

import lombok.Data;

/** 자주 주문한 품목 (같은 제품 + 같은 규격의 반복 주문). 납품처·비고·롤수는 가장 최근 주문의 값 */
@Data
public class FrequentItemDto {
    private String product;        // 제품코드
    private String productLabel;   // 별칭(고객이 부르는 이름)
    private int width;
    private int length;
    private int rolls;             // 가장 최근 주문의 롤수
    private String destination;    // 가장 최근 주문의 납품처
    private String note;           // 가장 최근 주문의 비고
    private int orderCount;        // 조회 기간 내 주문 횟수
}
