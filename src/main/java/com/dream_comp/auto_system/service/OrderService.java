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
        }

        log.info("주문 DB 저장 완료 (orderId={}, cliCode={})", orderId, dto.getCliCode());

        // ② 시트에 push (실패해도 트랜잭션 롤백 없음 - 흐름 B)
        sheetsWebhookService.push(orderId, dto);

        return new OrderResponseDto(orderId, "OK", "주문이 접수되었습니다.");
    }

    private String generateOrderId() {
        // ex) ORD-M3X7KA
        String base36 = Long.toString(System.currentTimeMillis(), 36).toUpperCase();
        return "ORD-" + base36.substring(base36.length() - 6);
    }
}
