package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.AdminUserDto;
import com.dream_comp.auto_system.dto.NewOrderEventDto;
import com.dream_comp.auto_system.dto.OrderRequestDto;
import com.dream_comp.auto_system.dto.OrderResponseDto;
import com.dream_comp.auto_system.mapper.OrderMapper;
import com.dream_comp.auto_system.service.OrderAvailabilityService;
import com.dream_comp.auto_system.service.OrderService;
import com.dream_comp.auto_system.service.SseBroadcaster;
import com.dream_comp.auto_system.vo.OrderVo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class OrderController {

    private static final int UNSEEN_PREVIEW_LIMIT = 5;

    private final OrderService orderService;
    private final OrderMapper orderMapper;
    private final SseBroadcaster sseBroadcaster;
    private final OrderAvailabilityService availabilityService;

    @PostMapping("/api/orders")
    public ResponseEntity<?> submit(@jakarta.validation.Valid @RequestBody OrderRequestDto dto,
                                    HttpServletRequest req) {
        // 접수 가능 시간대 가드 — 관리자가 아닌 경우에만 (관리자는 언제든 수동 접수 가능)
        HttpSession sessionPre = req.getSession(false);
        boolean fromAdminPre = sessionPre != null
                && sessionPre.getAttribute(AdminAuthController.SESSION_ADMIN) != null;
        if (!fromAdminPre) {
            OrderAvailabilityService.Result av = availabilityService.check();
            if (!av.available) {
                return ResponseEntity.status(403).body(Map.of(
                        "message", av.message,
                        "reason", av.reason
                ));
            }
        }

        OrderResponseDto res = orderService.submitOrder(dto);

        // 관리자 세션이 아닐 때만(= 고객 주문만) 알림 broadcast
        HttpSession session = req.getSession(false);
        boolean fromAdmin = session != null
                && session.getAttribute(AdminAuthController.SESSION_ADMIN) != null;
        if (!fromAdmin && res != null && "OK".equals(res.getStatus())) {
            try {
                NewOrderEventDto event = orderMapper.findEventByOrderId(res.getOrderId());
                if (event != null) sseBroadcaster.broadcastNewOrder(event);
            } catch (Exception e) {
                log.warn("SSE broadcast 실패 (orderId={}): {}", res.getOrderId(), e.getMessage());
            }
        }
        return ResponseEntity.ok(res);
    }

    /** 관리자 알림 SSE 스트림 — 접속 유지, new-order 이벤트 수신 */
    @GetMapping(value = "/api/admin/orders/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        AdminUserDto user = session == null
                ? null : (AdminUserDto) session.getAttribute(AdminAuthController.SESSION_ADMIN);
        if (user == null) {
            SseEmitter emitter = new SseEmitter(0L);
            emitter.completeWithError(new IllegalStateException("관리자 로그인이 필요합니다"));
            return emitter;
        }
        return sseBroadcaster.subscribe(user.getAdminNum());
    }

    /** 고객 주문 접수 가능 여부 — 페이지 접속 시 블록 UI 결정용 */
    @GetMapping("/api/orders/availability")
    public ResponseEntity<Map<String, Object>> availability() {
        OrderAvailabilityService.Result av = availabilityService.check();
        Map<String, Object> body = new HashMap<>();
        body.put("available", av.available);
        body.put("reason", av.reason);
        body.put("message", av.message);
        return ResponseEntity.ok(body);
    }

    /** 거래처별 주문 내역 (최신순) — 주문 페이지의 '내역 보기' 탭에서 사용 */
    @GetMapping("/api/clients/{cliCode}/orders")
    public ResponseEntity<List<OrderVo>> findByCliCode(
            @PathVariable String cliCode,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to) {
        return ResponseEntity.ok(orderService.findByCliCode(cliCode, from, to));
    }

    /** 자주 주문한 품목 (최근 90일, 같은 제품+규격 반복 횟수순) — 주문 폼의 빠른 담기용 */
    @GetMapping("/api/clients/{cliCode}/frequent-items")
    public ResponseEntity<List<com.dream_comp.auto_system.dto.FrequentItemDto>> frequentItems(
            @PathVariable String cliCode) {
        return ResponseEntity.ok(orderService.findFrequentItems(cliCode));
    }

    /** 관리자: 전체 주문 내역 (품목 단위 평면, 스프레드시트와 비교용) */
    @GetMapping("/api/admin/orders")
    public ResponseEntity<List<com.dream_comp.auto_system.dto.AdminOrderRowDto>> findAllForAdmin() {
        return ResponseEntity.ok(orderService.findAllForAdmin());
    }

    /** 관리자: 주문 품목 수정 (DB 전용 — 시트는 작업자가 직접 처리) */
    @PatchMapping("/api/admin/orders/items/{itemNum}")
    public ResponseEntity<com.dream_comp.auto_system.dto.AdminOrderRowDto> updateItem(
            @PathVariable Long itemNum,
            @RequestBody com.dream_comp.auto_system.dto.OrderItemUpdateDto dto) {
        return ResponseEntity.ok(orderService.updateItem(itemNum, dto));
    }

    /** 관리자: 재단 작업 완료 여부 체크/해제 (DB 전용 — 시트와 연동 없음). body: {"done": true|false} */
    @PatchMapping("/api/admin/orders/items/{itemNum}/cut-done")
    public ResponseEntity<Map<String, Object>> setCutDone(@PathVariable Long itemNum,
                                                           @RequestBody Map<String, Object> body) {
        Object v = body.get("done");
        if (!(v instanceof Boolean)) {
            return ResponseEntity.badRequest().body(Map.of("message", "done(true/false)이 필요합니다"));
        }
        boolean done = orderService.setCutDone(itemNum, (Boolean) v);
        return ResponseEntity.ok(Map.of("itemNum", itemNum, "cutDone", done));
    }

    /** 관리자: 주문 품목 취소 (DB 전용 — 행은 남기고 취소 표시만 함. 시트는 작업자가 직접 처리) */
    @PatchMapping("/api/admin/orders/items/{itemNum}/cancel")
    public ResponseEntity<Map<String, Object>> cancelItem(@PathVariable Long itemNum) {
        orderService.cancelItem(itemNum);
        return ResponseEntity.ok(Map.of("itemNum", itemNum, "cancelled", true));
    }

    /** 관리자: 취소된 품목을 새 주문으로 복구 (새 주문번호·현재 시각으로 접수, 시트에도 새로 전송) */
    @PostMapping("/api/admin/orders/items/{itemNum}/restore")
    public ResponseEntity<Map<String, Object>> restoreItem(@PathVariable Long itemNum) {
        OrderResponseDto res = orderService.restoreAsNewOrder(itemNum);
        Map<String, Object> body = new HashMap<>();
        body.put("itemNum", itemNum);
        body.put("newOrderId", res.getOrderId());
        body.put("deliveryDate", res.getDeliveryDate());
        return ResponseEntity.ok(body);
    }

    /** 관리자: 내가 아직 안 본 발주 수 + 미리보기 (최신 5건) */
    @GetMapping("/api/admin/orders/unseen")
    public ResponseEntity<Map<String, Object>> unseen(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        AdminUserDto user = session == null
                ? null : (AdminUserDto) session.getAttribute(AdminAuthController.SESSION_ADMIN);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "관리자 로그인이 필요합니다"));
        }
        Integer lastSeen = user.getLastSeenOrderNum() != null ? user.getLastSeenOrderNum() : 0;
        int unseenCount = orderMapper.countUnseen(lastSeen);
        List<NewOrderEventDto> preview =
                orderMapper.findUnseenPreview(lastSeen, UNSEEN_PREVIEW_LIMIT);
        Integer maxOrderNum = orderMapper.findMaxOrderNum();

        Map<String, Object> body = new HashMap<>();
        body.put("unseenCount", unseenCount);
        body.put("latestOrderNum", maxOrderNum);
        body.put("lastSeenOrderNum", lastSeen);
        body.put("preview", preview);
        return ResponseEntity.ok(body);
    }

    /** 거래처의 과거 사용 납품처 목록 (주문 폼 자동완성용) */
    @GetMapping("/api/clients/{cliCode}/destinations")
    public ResponseEntity<List<String>> findDestinations(@PathVariable String cliCode) {
        return ResponseEntity.ok(orderService.findDestinationsByCliCode(cliCode));
    }

    /** 관리자: 주문 1건의 감사 로그 조회 */
    @GetMapping("/api/admin/orders/{orderNum}/audit")
    public ResponseEntity<java.util.List<com.dream_comp.auto_system.dto.OrderAuditDto>> findAudit(
            @PathVariable Long orderNum) {
        return ResponseEntity.ok(orderService.findAuditByOrderNum(orderNum));
    }
}
