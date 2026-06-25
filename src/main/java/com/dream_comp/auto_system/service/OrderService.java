package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.OrderItemDto;
import com.dream_comp.auto_system.dto.OrderRequestDto;
import com.dream_comp.auto_system.dto.OrderResponseDto;
import com.dream_comp.auto_system.mapper.OrderMapper;
import com.dream_comp.auto_system.vo.OrderItemVo;
import com.dream_comp.auto_system.vo.OrderVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderMapper orderMapper;
    private final SheetsWebhookService sheetsWebhookService;

    @Transactional
    public OrderResponseDto submitOrder(OrderRequestDto dto) {
        String orderId = generateOrderId();

        // ① DB에 PENDING으로 INSERT
        OrderVo orderVo = new OrderVo();
        orderVo.setCliCode(dto.getCliCode());
        orderVo.setOrderId(orderId);
        orderVo.setStatus("PENDING");
        orderVo.setOrderDate(LocalDateTime.now());
        orderMapper.insertOrder(orderVo);

        java.util.List<Long> itemNums = new java.util.ArrayList<>();
        for (OrderItemDto item : dto.getItems()) {
            OrderItemVo itemVo = new OrderItemVo();
            itemVo.setOrderNum(orderVo.getOrderNum()); // useGeneratedKeys로 채워진 PK
            itemVo.setProduct(item.getProduct());
            itemVo.setProductLabel(item.getProductLabel());
            itemVo.setWidth(item.getWidth());
            itemVo.setLength(item.getLength());
            itemVo.setRolls(item.getRolls());
            itemVo.setDestination(item.getDestination() != null ? item.getDestination() : "");
            itemVo.setNote(item.getNote() != null ? item.getNote() : "");
            orderMapper.insertOrderItem(itemVo);
            itemNums.add(itemVo.getItemNum()); // ★ INSERT 후 채워진 ITEM_NUM
        }

        log.info("주문 DB 저장 완료 (orderId={}, cliCode={})", orderId, dto.getCliCode());

        // ② 시트에 push (실패해도 트랜잭션 롤백 없음 - 흐름 B)
        boolean pushed = sheetsWebhookService.push(orderId, dto, itemNums);
        orderMapper.updateStatus(orderVo.getOrderNum(), pushed ? "OK" : "FAILED");

        return new OrderResponseDto(orderId, "OK", "주문이 접수되었습니다.");
    }

    public java.util.List<com.dream_comp.auto_system.vo.OrderVo> findByCliCode(String cliCode) {
        return orderMapper.findByCliCode(cliCode);
    }

    public java.util.List<com.dream_comp.auto_system.dto.AdminOrderRowDto> findAllForAdmin() {
        return orderMapper.findAllAdmin();
    }

    public void markSheetStatus(Long orderNum, String status) {
        orderMapper.updateStatus(orderNum, status);
    }

    /** 관리자: 주문 품목 삭제 → DB 삭제 + 시트 행 비우기. 한 주문의 마지막 품목이면 헤더도 삭제. */
    @Transactional
    public void deleteItem(Long itemNum) {
        com.dream_comp.auto_system.dto.AdminOrderRowDto row = orderMapper.findAdminItemByNum(itemNum);
        if (row == null) throw new IllegalArgumentException("존재하지 않는 주문 품목입니다");

        Long orderNum = row.getOrderNum();
        orderMapper.deleteItem(itemNum);

        // 같은 주문의 다른 품목이 없으면 헤더도 삭제
        if (orderMapper.countItemsByOrderNum(orderNum) == 0) {
            orderMapper.deleteOrder(orderNum);
        }

        sheetsWebhookService.pushItemDelete(itemNum);
    }

    /** 관리자: 주문 품목 수정 → DB 반영 후 스프레드시트도 동기화 */
    @Transactional
    public com.dream_comp.auto_system.dto.AdminOrderRowDto updateItem(
            Long itemNum, com.dream_comp.auto_system.dto.OrderItemUpdateDto dto) {

        com.dream_comp.auto_system.dto.AdminOrderRowDto current = orderMapper.findAdminItemByNum(itemNum);
        if (current == null) {
            throw new IllegalArgumentException("존재하지 않는 주문 품목입니다");
        }
        if (dto.getProduct() == null || dto.getProduct().isBlank())
            throw new IllegalArgumentException("제품코드를 입력해 주세요");
        if (dto.getProductLabel() == null || dto.getProductLabel().isBlank())
            throw new IllegalArgumentException("제품명을 입력해 주세요");
        if (dto.getRolls() != null && dto.getRolls() < 0)
            throw new IllegalArgumentException("롤수는 0 이상이어야 합니다");

        com.dream_comp.auto_system.vo.OrderItemUpdateVo vo = new com.dream_comp.auto_system.vo.OrderItemUpdateVo();
        vo.setItemNum(itemNum);
        vo.setProduct(dto.getProduct());
        vo.setProductLabel(dto.getProductLabel());
        vo.setWidth(dto.getWidth());
        vo.setLength(dto.getLength());
        vo.setRolls(dto.getRolls());
        vo.setDestination(dto.getDestination());
        vo.setNote(dto.getNote());
        vo.setDeliveryDate(dto.getDeliveryDate());
        orderMapper.updateItem(vo);

        if (dto.getOrderDate() != null) {
            orderMapper.updateOrderDate(current.getOrderNum(), dto.getOrderDate());
        }

        com.dream_comp.auto_system.dto.AdminOrderRowDto updated = orderMapper.findAdminItemByNum(itemNum);

        // 스프레드시트 동기화 호출 (실패해도 DB는 유지)
        sheetsWebhookService.pushItemUpdate(updated);

        return updated;
    }

    private String generateOrderId() {
        // ex) ORD-M3X7KA
        String base36 = Long.toString(System.currentTimeMillis(), 36).toUpperCase();
        return "ORD-" + base36.substring(base36.length() - 6);
    }
}
