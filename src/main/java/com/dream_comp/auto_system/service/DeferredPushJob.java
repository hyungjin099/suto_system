package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.AdminOrderRowDto;
import com.dream_comp.auto_system.dto.OrderItemDto;
import com.dream_comp.auto_system.dto.OrderRequestDto;
import com.dream_comp.auto_system.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 18시 이후 접수된 DEFERRED 주문을 다음 영업일 새벽에 일괄 push.
 *
 * - 영업일 판정: 월~금 + HolidayService(공휴일/임시공휴일). 비영업일이면 DEFERRED 유지 → 다음 영업일 재시도
 * - 판정이 어긋나 Apps Script가 ERROR를 돌려줘도 push()가 실패로 처리하므로 DEFERRED 유지
 * - 트리거: 매일 02:00 KST (01시 Apps Script 미완료 이월 이후에 돌도록)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeferredPushJob {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final int MAX_PER_RUN = 500;

    private final OrderMapper orderMapper;
    private final SheetsWebhookService sheetsWebhookService;
    private final OrderService orderService;
    private final HolidayService holidayService;

    @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Seoul")
    public void run() {
        LocalDate today = LocalDate.now(KST);
        DayOfWeek dow = today.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY || holidayService.isHoliday(today)) {
            log.info("DeferredPushJob — 오늘({}) 영업일 아님, skip", today);
            return;
        }

        List<AdminOrderRowDto> rows = orderMapper.findDeferredCandidates();
        if (rows.isEmpty()) {
            log.info("DeferredPushJob — DEFERRED 주문 없음");
            return;
        }

        Map<Long, List<AdminOrderRowDto>> grouped = new LinkedHashMap<>();
        for (AdminOrderRowDto r : rows) {
            grouped.computeIfAbsent(r.getOrderNum(), k -> new ArrayList<>()).add(r);
        }

        int ok = 0, fail = 0, processed = 0;
        for (Map.Entry<Long, List<AdminOrderRowDto>> e : grouped.entrySet()) {
            if (processed >= MAX_PER_RUN) break;
            processed++;

            Long orderNum = e.getKey();
            List<AdminOrderRowDto> items = e.getValue();
            AdminOrderRowDto head = items.get(0);

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
                // ★ 중요: 원래 접수 시각을 넘겨서 시트의 발주일(C열)이 실제 접수 시각으로 들어가도록 함.
                //   그렇게 하지 않으면 다음날 01시가 발주일로 기록되고 배경색/납기 계산이 왜곡됨.
                pushed = sheetsWebhookService.push(
                        head.getOrderId(), dto, itemNums, head.getOrderDate()
                ).success;
            } catch (Exception ex) {
                log.warn("DeferredPush 예외 (orderId={}): {}", head.getOrderId(), ex.getMessage());
            }
            if (pushed) {
                orderService.markSheetStatus(orderNum, "OK");
                ok++;
            } else {
                // 실패하면 DEFERRED 유지 → 다음 날 재시도. (SheetsRetryJob의 24시간 윈도우에서 벗어나 있으므로 중복 push 걱정 없음)
                fail++;
            }
        }
        log.info("DeferredPushJob 완료 — total={}, ok={}, fail={}", processed, ok, fail);
    }
}
