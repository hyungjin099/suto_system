package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.AdminOrderRowDto;
import com.dream_comp.auto_system.dto.OrderItemDto;
import com.dream_comp.auto_system.dto.OrderRequestDto;
import com.dream_comp.auto_system.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 시트 푸시 재시도 — 5분마다 STATUS != 'OK' (24시간 이내) 주문을 다시 전송 시도.
 * 한 번에 최대 20건만 처리해 시트 quota 보호.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SheetsRetryJob {

    private static final int MAX_PER_RUN = 20;

    private final OrderMapper orderMapper;
    private final SheetsWebhookService sheetsWebhookService;
    private final OrderService orderService;

    @Scheduled(fixedDelayString = "PT5M", initialDelayString = "PT1M")
    public void retry() {
        List<AdminOrderRowDto> rows = orderMapper.findRetryCandidates();
        if (rows.isEmpty()) return;

        // orderNum 기준으로 묶기 (한 주문 = 여러 품목 행)
        Map<Long, List<AdminOrderRowDto>> grouped = new LinkedHashMap<>();
        for (AdminOrderRowDto r : rows) {
            grouped.computeIfAbsent(r.getOrderNum(), k -> new ArrayList<>()).add(r);
        }

        int processed = 0;
        for (Map.Entry<Long, List<AdminOrderRowDto>> e : grouped.entrySet()) {
            if (processed >= MAX_PER_RUN) break;
            processed++;

            Long orderNum = e.getKey();
            List<AdminOrderRowDto> items = e.getValue();
            AdminOrderRowDto head = items.get(0);

            // OrderRequestDto / itemNums 재구성
            OrderRequestDto dto = new OrderRequestDto();
            dto.setCliCode(head.getCliCode());
            dto.setClientName(head.getCliCompName() == null ? "" : head.getCliCompName());
            dto.setManagerPhone("");

            List<OrderItemDto> itemDtos = new ArrayList<>();
            List<Long> itemNums = new ArrayList<>();
            for (AdminOrderRowDto it : items) {
                if (it.getItemNum() == null) continue;
                OrderItemDto idto = new OrderItemDto();
                idto.setProduct(it.getProduct());
                idto.setProductLabel(it.getProductLabel());
                idto.setWidth(it.getWidth() == null ? 0 : it.getWidth());
                idto.setLength(it.getLength() == null ? 0 : it.getLength());
                idto.setRolls(it.getRolls() == null ? 0 : it.getRolls());
                idto.setDestination(it.getDestination());
                idto.setNote(it.getNote());
                itemDtos.add(idto);
                itemNums.add(it.getItemNum());
            }
            if (itemDtos.isEmpty()) continue;
            dto.setItems(itemDtos);

            boolean pushed = false;
            try {
                pushed = sheetsWebhookService.push(head.getOrderId(), dto, itemNums);
            } catch (Exception ex) {
                log.warn("재시도 push 예외 (orderId={}): {}", head.getOrderId(), ex.getMessage());
            }
            if (pushed) {
                orderService.markSheetStatus(orderNum, "OK");
                log.info("재시도 성공 (orderId={}, orderNum={})", head.getOrderId(), orderNum);
            } else {
                // 실패면 다음 주기에 또 시도. STATUS는 FAILED 유지
                log.info("재시도 실패 (orderId={}, orderNum={}) — 다음 주기에 다시 시도", head.getOrderId(), orderNum);
            }
        }

        if (processed > 0) log.info("Webhook 재시도 잡 — {}건 처리", processed);
    }
}
