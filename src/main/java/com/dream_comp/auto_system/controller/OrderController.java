package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.OrderRequestDto;
import com.dream_comp.auto_system.dto.OrderResponseDto;
import com.dream_comp.auto_system.service.OrderService;
import com.dream_comp.auto_system.vo.OrderVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/api/orders")
    public ResponseEntity<OrderResponseDto> submit(@RequestBody OrderRequestDto dto) {
        return ResponseEntity.ok(orderService.submitOrder(dto));
    }

    /** 거래처별 주문 내역 (최신순) — 주문 페이지의 '내역 보기' 탭에서 사용 */
    @GetMapping("/api/clients/{cliCode}/orders")
    public ResponseEntity<List<OrderVo>> findByCliCode(@PathVariable String cliCode) {
        return ResponseEntity.ok(orderService.findByCliCode(cliCode));
    }

    /** 관리자: 전체 주문 내역 (품목 단위 평면, 스프레드시트와 비교용) */
    @GetMapping("/api/admin/orders")
    public ResponseEntity<List<com.dream_comp.auto_system.dto.AdminOrderRowDto>> findAllForAdmin() {
        return ResponseEntity.ok(orderService.findAllForAdmin());
    }

    /** 관리자: 주문 품목 수정 (DB + 시트 동기화) */
    @PatchMapping("/api/admin/orders/items/{itemNum}")
    public ResponseEntity<com.dream_comp.auto_system.dto.AdminOrderRowDto> updateItem(
            @PathVariable Long itemNum,
            @RequestBody com.dream_comp.auto_system.dto.OrderItemUpdateDto dto) {
        return ResponseEntity.ok(orderService.updateItem(itemNum, dto));
    }

    /** 관리자: 주문 품목 삭제 (DB + 시트 동기화) */
    @DeleteMapping("/api/admin/orders/items/{itemNum}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long itemNum) {
        orderService.deleteItem(itemNum);
        return ResponseEntity.noContent().build();
    }

    /** 관리자: 비즈니스 워크플로 상태 변경 */
    @PatchMapping("/api/admin/orders/{orderNum}/workflow-status")
    public ResponseEntity<com.dream_comp.auto_system.dto.AdminOrderRowDto> updateWorkflowStatus(
            @PathVariable Long orderNum,
            @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(orderService.updateWorkflowStatus(orderNum, body.get("workflowStatus")));
    }

    /** 관리자: 주문 1건의 감사 로그 조회 */
    @GetMapping("/api/admin/orders/{orderNum}/audit")
    public ResponseEntity<java.util.List<com.dream_comp.auto_system.dto.OrderAuditDto>> findAudit(
            @PathVariable Long orderNum) {
        return ResponseEntity.ok(orderService.findAuditByOrderNum(orderNum));
    }
}
