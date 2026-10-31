package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.AdminOrderRowDto;
import com.dream_comp.auto_system.vo.OrderItemUpdateVo;
import com.dream_comp.auto_system.vo.OrderItemVo;
import com.dream_comp.auto_system.vo.OrderVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface OrderMapper {
    void insertOrder(OrderVo orderVo);
    void insertOrderItem(OrderItemVo itemVo);
    /** 거래처별 주문 내역(최신순). from 이상 ~ to 미만(둘 다 null 가능 = 제한 없음) */
    List<OrderVo> findByCliCode(@Param("cliCode") String cliCode,
                                @Param("from") java.time.LocalDateTime from,
                                @Param("to") java.time.LocalDateTime to);
    List<AdminOrderRowDto> findAllAdmin();
    List<AdminOrderRowDto> findRetryCandidates();
    List<AdminOrderRowDto> findDeferredCandidates();
    AdminOrderRowDto findAdminItemByNum(Long itemNum);
    int updateStatus(@Param("orderNum") Long orderNum, @Param("status") String status);
    int updateOrderDate(@Param("orderNum") Long orderNum,
                        @Param("orderDate") java.time.LocalDateTime orderDate);
    List<String> findDestinationsByCliCode(@Param("cliCode") String cliCode);
    /** ORDER_ID가 특정 접두어(예: '20260822_')로 시작하는 것 중 최대값. 해당 일자의 마지막 시퀀스 파악용 */
    String findMaxOrderIdWithPrefix(@Param("prefix") String prefix);
    int updateItem(OrderItemUpdateVo vo);
    /** 재단 작업 완료 여부('Y'/'N') 변경 */
    int updateCutDone(@Param("itemNum") Long itemNum, @Param("cutDone") String cutDone);
    /** 품목 취소 표시 ('Y'). 행은 지우지 않는다 */
    int updateCancel(@Param("itemNum") Long itemNum, @Param("cancelYn") String cancelYn);
    /** 새 주문으로 복구 시작 선점. 이미 복구됐거나 취소 상태가 아니면 0 */
    int claimRestore(@Param("itemNum") Long itemNum);
    /** 복구로 만든 새 주문번호 기록 (null 이면 선점 해제) */
    int updateRestored(@Param("itemNum") Long itemNum, @Param("orderId") String orderId);

    /** 알림: 현재 DB에 저장된 최대 ORDER_NUM (없으면 NULL) */
    Integer findMaxOrderNum();
    /** 알림: 미확인 발주 수 (ORDER_NUM > lastSeen) */
    int countUnseen(@Param("lastSeen") Integer lastSeen);
    /** 알림: 미확인 발주 요약 (최신순, limit건) */
    List<com.dream_comp.auto_system.dto.NewOrderEventDto> findUnseenPreview(
            @Param("lastSeen") Integer lastSeen,
            @Param("limit") int limit);
    /** 알림: orderId로 단건 이벤트 조회 (방금 접수한 주문을 broadcast 하기 위해) */
    com.dream_comp.auto_system.dto.NewOrderEventDto findEventByOrderId(
            @Param("orderId") String orderId);
}
