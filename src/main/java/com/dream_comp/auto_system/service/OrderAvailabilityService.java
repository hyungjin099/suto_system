package com.dream_comp.auto_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * 고객 주문 접수 가능 여부 판정.
 *
 * 거절 사유:
 *   - 주말 (토·일)
 *   - 공휴일/임시공휴일 (HolidayService)
 *   - 23:00~02:59 (심야 시간대) KST
 *
 * 응답:
 *   available=true  → 즉시 접수
 *   available=false → reason/message 포함, 클라이언트가 전체 블록 UI 표시
 */
@Service
@RequiredArgsConstructor
public class OrderAvailabilityService {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private static final int NIGHT_BLOCK_START = 23; // 23:00~
    private static final int NIGHT_BLOCK_END = 3;    // ~02:59 (3시 미만)

    private final HolidayService holidayService;

    public Result check() {
        return check(LocalDateTime.now(KST));
    }

    public Result check(LocalDateTime nowKst) {
        DayOfWeek dow = nowKst.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            return new Result(false, "WEEKEND",
                    "주말에는 주문을 접수하지 않습니다.");
        }
        if (holidayService.isHoliday(nowKst.toLocalDate())) {
            return new Result(false, "HOLIDAY",
                    "공휴일에는 주문을 접수하지 않습니다.");
        }
        int h = nowKst.getHour();
        if (h >= NIGHT_BLOCK_START || h < NIGHT_BLOCK_END) {
            return new Result(false, "NIGHT",
                    "주문 접수 시간이 아닙니다. (23:00 ~ 03:00 접수 중단)");
        }
        return new Result(true, null, null);
    }

    public static class Result {
        public final boolean available;
        public final String  reason;
        public final String  message;
        public Result(boolean available, String reason, String message) {
            this.available = available;
            this.reason = reason;
            this.message = message;
        }
    }
}
