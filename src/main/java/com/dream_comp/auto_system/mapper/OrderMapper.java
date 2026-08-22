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
    List<OrderVo> findByCliCode(String cliCode);
    List<AdminOrderRowDto> findAllAdmin();
    List<AdminOrderRowDto> findRetryCandidates();
    AdminOrderRowDto findAdminItemByNum(Long itemNum);
    int updateStatus(@Param("orderNum") Long orderNum, @Param("status") String status);
    int updateOrderDate(@Param("orderNum") Long orderNum,
                        @Param("orderDate") java.time.LocalDateTime orderDate);
    List<String> findDestinationsByCliCode(@Param("cliCode") String cliCode);
    /** ORDER_ID가 특정 접두어(예: '20260822_')로 시작하는 것 중 최대값. 해당 일자의 마지막 시퀀스 파악용 */
    String findMaxOrderIdWithPrefix(@Param("prefix") String prefix);
    int updateItem(OrderItemUpdateVo vo);
    int deleteItem(Long itemNum);
    int countItemsByOrderNum(Long orderNum);
    int deleteOrder(Long orderNum);
}
