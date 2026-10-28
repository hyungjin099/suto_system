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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final int MAX_ORDERID_RETRY = 5;
    /** 이 시각 이후 접수된 주문은 당일 일자 탭 push를 생략하고 다음 영업일 새벽 배치로 보냄 */
    private static final int DEFER_PUSH_HOUR = 18;

    public OrderResponseDto submitOrder(OrderRequestDto dto) {
        OrderInsertResult inserted = null;
        for (int attempt = 1; attempt <= MAX_ORDERID_RETRY; attempt++) {
            try {
                inserted = transactionTemplate.execute(status -> insertOrderAndItems(dto));
                break;
            } catch (DuplicateKeyException e) {
                if (attempt == MAX_ORDERID_RETRY) throw e;
                log.warn("주문번호 충돌 (재시도 {}/{})", attempt, MAX_ORDERID_RETRY);
            }
        }

        LocalDateTime nowKst = LocalDateTime.now(KST);
        boolean defer = nowKst.getHour() >= DEFER_PUSH_HOUR;

        SheetsWebhookService.PushResult push = new SheetsWebhookService.PushResult(false, null);
        if (defer) {
            // 18시 이후 접수: 당일 push 생략. DEFERRED 상태로 두면 다음날 02시 DeferredPushJob이 처리.
            markSheetStatus(inserted.orderNum, "DEFERRED");
        } else {
            try {
                push = sheetsWebhookService.push(inserted.orderId, dto, inserted.itemNums);
            } catch (Exception e) {
                log.warn("Sheets push 예외 (orderId={}): {}", inserted.orderId, e.getMessage());
            }
            markSheetStatus(inserted.orderNum, push.success ? "OK" : "FAILED");
        }

        // 납기예정일: Apps Script가 계산한 값(공휴일 반영) 우선, 없으면 Java 근사값 폴백
        String deliveryDate = push.deliveryDate != null
                ? push.deliveryDate
                : computeDeliveryDate(LocalDateTime.now(KST));

        return new OrderResponseDto(
                inserted.orderId,
                "OK",
                "주문이 접수되었습니다.",
                deliveryDate
        );
    }

    /**
     * 납기예정일(근사): 발주시각이 13시 이전이면 +1영업일, 이후면 +2영업일. 주말은 건너뜀.
     * 공휴일까지 정확히 반영하려면 Apps Script의 값을 참조해야 함 (여기선 UX용 근사값).
     */
    private String computeDeliveryDate(LocalDateTime orderDateTime) {
        int steps = orderDateTime.getHour() < 13 ? 1 : 2;
        java.time.LocalDate d = orderDateTime.toLocalDate();
        while (steps > 0) {
            d = d.plusDays(1);
            java.time.DayOfWeek dow = d.getDayOfWeek();
            if (dow == java.time.DayOfWeek.SATURDAY || dow == java.time.DayOfWeek.SUNDAY) continue;
            steps--;
        }
        return d.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));
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

    /** 접수일 기준 from(포함) ~ to(포함) 기간의 주문. 둘 다 null이면 전체. */
    public List<OrderVo> findByCliCode(String cliCode, LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("조회 시작일이 종료일보다 늦을 수 없습니다");
        }
        LocalDateTime fromDt = from == null ? null : from.atStartOfDay();
        LocalDateTime toDt = to == null ? null : to.plusDays(1).atStartOfDay();   // 종료일 하루 전체 포함
        return orderMapper.findByCliCode(cliCode, fromDt, toDt);
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

    /**
     * 품목 취소/복구. 행을 지우지 않고 취소 표시만 한다(취소 이력 조회용).
     * 시트에는 반영하지 않는다: 이미 시트에 올라간 주문은 작업자가 직접 처리하는 설계.
     */
    @Transactional
    public boolean setCancelled(Long itemNum, boolean cancel) {
        AdminOrderRowDto row = orderMapper.findAdminItemByNum(itemNum);
        if (row == null) throw new IllegalArgumentException("존재하지 않는 주문 품목입니다");

        String next = cancel ? "Y" : "N";
        if (next.equals(row.getCancelled())) return cancel;   // 이미 같은 상태면 기록하지 않음

        orderMapper.updateCancel(itemNum, next);

        orderAuditService.log(cancel ? "CANCEL" : "RESTORE", row.getOrderNum(), itemNum,
                snapshotOf(row), null, cancel ? "품목 취소" : "품목 취소 복구");
        return cancel;
    }

    @Transactional
    public AdminOrderRowDto updateItem(Long itemNum, OrderItemUpdateDto dto) {
        AdminOrderRowDto current = orderMapper.findAdminItemByNum(itemNum);
        if (current == null) throw new IllegalArgumentException("존재하지 않는 주문 품목입니다");
        if ("Y".equals(current.getCancelled())) throw new IllegalArgumentException("취소된 품목은 수정할 수 없습니다. 먼저 취소를 복구해 주세요");
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
        // 시트 반영 안 함: 작업자가 시트에서 직접 처리하는 설계 (가이드 참고)
        return updated;
    }

    /** 재단 작업 완료 여부 변경. 관리자 화면 전용이며 스프레드시트에는 반영하지 않는다. */
    @Transactional
    public boolean setCutDone(Long itemNum, boolean done) {
        AdminOrderRowDto current = orderMapper.findAdminItemByNum(itemNum);
        if (current == null) throw new IllegalArgumentException("존재하지 않는 주문 품목입니다");
        if ("Y".equals(current.getCancelled())) throw new IllegalArgumentException("취소된 품목입니다");

        String next = done ? "Y" : "N";
        if (next.equals(current.getCutDone())) return done;   // 이미 같은 상태면 기록하지 않음

        orderMapper.updateCutDone(itemNum, next);

        Map<String, Object> before = new HashMap<>();
        before.put("cutDone", current.getCutDone());
        Map<String, Object> after = new HashMap<>();
        after.put("cutDone", next);
        orderAuditService.log("WORKFLOW_CHANGE", current.getOrderNum(), itemNum, before, after,
                done ? "재단 작업 완료 체크" : "재단 작업 완료 해제");
        return done;
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

    /**
     * 주문번호: 'YYYYMMDD-NNN' 형식. 오늘 날짜 접두어 기준 최대 시퀀스+1 부여.
     * 하루 999건 넘으면 IllegalStateException (현실적으로 발생 안 함, 고객사 확인 완료).
     */
    private String generateOrderId() {
        String prefix = LocalDate.now(KST).format(DATE_FMT) + "-";
        String maxId = orderMapper.findMaxOrderIdWithPrefix(prefix);
        int nextSeq = 1;
        if (maxId != null) {
            int hyphen = maxId.lastIndexOf('-');
            if (hyphen >= 0) {
                try {
                    nextSeq = Integer.parseInt(maxId.substring(hyphen + 1)) + 1;
                } catch (NumberFormatException ignored) {
                    // 예상 밖 포맷이면 1로 시작 (극단적 케이스)
                }
            }
        }
        if (nextSeq > 999) {
            throw new IllegalStateException("하루 주문 상한(999건)을 초과했습니다");
        }
        return String.format("%s%03d", prefix, nextSeq);
    }
}
