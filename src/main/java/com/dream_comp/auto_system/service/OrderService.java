package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.AdminOrderRowDto;
import com.dream_comp.auto_system.dto.ClientFabricDto;
import com.dream_comp.auto_system.dto.OrderItemDto;
import com.dream_comp.auto_system.dto.OrderItemUpdateDto;
import com.dream_comp.auto_system.dto.OrderRequestDto;
import com.dream_comp.auto_system.dto.OrderResponseDto;
import com.dream_comp.auto_system.mapper.ClientFabricMapper;
import com.dream_comp.auto_system.mapper.OrderMapper;
import com.dream_comp.auto_system.vo.OrderItemUpdateVo;
import com.dream_comp.auto_system.vo.OrderItemVo;
import com.dream_comp.auto_system.vo.OrderVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderMapper orderMapper;
    private final ClientFabricMapper clientFabricMapper;
    private final SheetsWebhookService sheetsWebhookService;
    private final OrderAuditService orderAuditService;
    private final TransactionTemplate transactionTemplate;

    private static final SecureRandom RNG = new SecureRandom();
    private static final String B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public OrderResponseDto submitOrder(OrderRequestDto dto) {
        OrderInsertResult inserted = transactionTemplate.execute(status -> insertOrderAndItems(dto));

        boolean pushed = false;
        try {
            pushed = sheetsWebhookService.push(inserted.orderId, dto, inserted.itemNums);
        } catch (Exception e) {
            log.warn("Sheets push 예외 (orderId={}): {}", inserted.orderId, e.getMessage());
        }
        markSheetStatus(inserted.orderNum, pushed ? "OK" : "FAILED");

        return new OrderResponseDto(inserted.orderId, "OK", "주문이 접수되었습니다.");
    }

    /** 짧은 트랜잭션 안에서 실행. 가격 스냅샷도 함께 캡처. */
    private OrderInsertResult insertOrderAndItems(OrderRequestDto dto) {
        String orderId = generateOrderId();

        OrderVo orderVo = new OrderVo();
        orderVo.setCliCode(dto.getCliCode());
        orderVo.setOrderId(orderId);
        orderVo.setStatus("PENDING");
        orderVo.setOrderDate(LocalDateTime.now());
        orderMapper.insertOrder(orderVo);

        List<Long> itemNums = new ArrayList<>();
        List<Map<String, Object>> auditItems = new ArrayList<>();
        for (OrderItemDto item : dto.getItems()) {
            // 가격 스냅샷 — 같은 원단에 별칭이 여러 개일 수 있으므로 별칭명까지 매칭
            ClientFabricDto snap = clientFabricMapper.findOneByCliCodeProdCodeAndAlias(
                    dto.getCliCode(), item.getProduct(), item.getProductLabel());

            OrderItemVo itemVo = new OrderItemVo();
            itemVo.setOrderNum(orderVo.getOrderNum());
            itemVo.setProduct(item.getProduct());
            itemVo.setProductLabel(item.getProductLabel());
            itemVo.setWidth(item.getWidth());
            itemVo.setLength(item.getLength());
            itemVo.setRolls(item.getRolls());
            itemVo.setDestination(item.getDestination() != null ? item.getDestination() : "");
            itemVo.setNote(item.getNote() != null ? item.getNote() : "");
            itemVo.setUnitPrice(snap != null ? snap.getClientFabPrice() : null);
            itemVo.setAliasName(snap != null ? snap.getAliasName() : null);
            orderMapper.insertOrderItem(itemVo);
            itemNums.add(itemVo.getItemNum());

            Map<String, Object> a = new HashMap<>();
            a.put("itemNum", itemVo.getItemNum());
            a.put("product", item.getProduct());
            a.put("productLabel", item.getProductLabel());
            a.put("width", item.getWidth());
            a.put("length", item.getLength());
            a.put("rolls", item.getRolls());
            a.put("unitPrice", itemVo.getUnitPrice());
            a.put("aliasName", itemVo.getAliasName());
            auditItems.add(a);
        }

        Map<String, Object> auditAfter = new HashMap<>();
        auditAfter.put("orderId", orderId);
        auditAfter.put("cliCode", dto.getCliCode());
        auditAfter.put("clientName", dto.getClientName());
        auditAfter.put("items", auditItems);
        orderAuditService.log("CREATE", orderVo.getOrderNum(), null, null, auditAfter,
                "주문 생성 (" + dto.getItems().size() + "개 품목)");

        log.info("주문 DB 저장 완료 (orderId={}, cliCode={})", orderId, dto.getCliCode());
        return new OrderInsertResult(orderId, orderVo.getOrderNum(), itemNums);
    }

    private static class OrderInsertResult {
        final String orderId;
        final Long orderNum;
        final List<Long> itemNums;
        OrderInsertResult(String orderId, Long orderNum, List<Long> itemNums) {
            this.orderId = orderId; this.orderNum = orderNum; this.itemNums = itemNums;
        }
    }

    public List<OrderVo> findByCliCode(String cliCode) {
        return orderMapper.findByCliCode(cliCode);
    }

    public List<AdminOrderRowDto> findAllForAdmin() {
        return orderMapper.findAllAdmin();
    }

    @Transactional
    public void markSheetStatus(Long orderNum, String status) {
        orderMapper.updateStatus(orderNum, status);
    }

    public List<String> findDestinationsByCliCode(String cliCode) {
        return orderMapper.findDestinationsByCliCode(cliCode);
    }

    @Transactional
    public void deleteItem(Long itemNum) {
        AdminOrderRowDto row = orderMapper.findAdminItemByNum(itemNum);
        if (row == null) throw new IllegalArgumentException("존재하지 않는 주문 품목입니다");

        Long orderNum = row.getOrderNum();
        orderMapper.deleteItem(itemNum);

        boolean orderRemoved = false;
        if (orderMapper.countItemsByOrderNum(orderNum) == 0) {
            orderMapper.deleteOrder(orderNum);
            orderRemoved = true;
        }

        orderAuditService.log("DELETE", orderNum, itemNum, snapshotOf(row), null,
                orderRemoved ? "품목 삭제 + 마지막 품목이라 주문 헤더도 삭제됨" : "품목 삭제");

        sheetsWebhookService.pushItemDelete(itemNum);
    }

    @Transactional
    public AdminOrderRowDto updateItem(Long itemNum, OrderItemUpdateDto dto) {
        AdminOrderRowDto current = orderMapper.findAdminItemByNum(itemNum);
        if (current == null) throw new IllegalArgumentException("존재하지 않는 주문 품목입니다");
        if (dto.getProduct() == null || dto.getProduct().isBlank())
            throw new IllegalArgumentException("제품코드를 입력해 주세요");
        if (dto.getProductLabel() == null || dto.getProductLabel().isBlank())
            throw new IllegalArgumentException("제품명을 입력해 주세요");
        if (dto.getRolls() != null && dto.getRolls() < 0)
            throw new IllegalArgumentException("롤수는 0 이상이어야 합니다");
        if (dto.getUnitPrice() != null && dto.getUnitPrice() < 0)
            throw new IllegalArgumentException("단가는 0 이상이어야 합니다");

        OrderItemUpdateVo vo = new OrderItemUpdateVo();
        vo.setItemNum(itemNum);
        vo.setProduct(dto.getProduct());
        vo.setProductLabel(dto.getProductLabel());
        vo.setWidth(dto.getWidth());
        vo.setLength(dto.getLength());
        vo.setRolls(dto.getRolls());
        vo.setDestination(dto.getDestination());
        vo.setNote(dto.getNote());
        vo.setDeliveryDate(dto.getDeliveryDate());
        vo.setUnitPrice(dto.getUnitPrice());
        vo.setAliasName(dto.getAliasName());
        orderMapper.updateItem(vo);

        if (dto.getOrderDate() != null) {
            orderMapper.updateOrderDate(current.getOrderNum(), dto.getOrderDate());
        }

        AdminOrderRowDto updated = orderMapper.findAdminItemByNum(itemNum);

        orderAuditService.log("UPDATE", current.getOrderNum(), itemNum,
                snapshotOf(current), snapshotOf(updated), "품목 수정");

        sheetsWebhookService.pushItemUpdate(updated);
        return updated;
    }

    public List<com.dream_comp.auto_system.dto.OrderAuditDto> findAuditByOrderNum(Long orderNum) {
        return orderAuditService.findByOrderNum(orderNum);
    }

    private Map<String, Object> snapshotOf(AdminOrderRowDto r) {
        Map<String, Object> m = new HashMap<>();
        if (r == null) return m;
        m.put("product", r.getProduct());
        m.put("productLabel", r.getProductLabel());
        m.put("width", r.getWidth());
        m.put("length", r.getLength());
        m.put("rolls", r.getRolls());
        m.put("destination", r.getDestination());
        m.put("note", r.getNote());
        m.put("deliveryDate", r.getDeliveryDate());
        m.put("unitPrice", r.getUnitPrice());
        m.put("aliasName", r.getAliasName());
        m.put("orderDate", r.getOrderDate());
        return m;
    }

    /** 시간 + 4자 랜덤. 동시 ms 충돌 가능성 거의 0. */
    private String generateOrderId() {
        long ms = System.currentTimeMillis();
        StringBuilder sb = new StringBuilder("ORD-");
        String t = Long.toString(ms, 36).toUpperCase();
        sb.append(t.substring(t.length() - 4));
        for (int i = 0; i < 4; i++) sb.append(B36.charAt(RNG.nextInt(B36.length())));
        return sb.toString();
    }
}
