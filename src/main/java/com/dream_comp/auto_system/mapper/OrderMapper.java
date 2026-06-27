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
    AdminOrderRowDto findAdminItemByNum(Long itemNum);
    int updateStatus(@Param("orderNum") Long orderNum, @Param("status") String status);
    int updateWorkflowStatus(@Param("orderNum") Long orderNum,
                              @Param("workflowStatus") String workflowStatus);
    int updateOrderDate(@Param("orderNum") Long orderNum,
                        @Param("orderDate") java.time.LocalDateTime orderDate);
    int updateItem(OrderItemUpdateVo vo);
    int deleteItem(Long itemNum);
    int countItemsByOrderNum(Long orderNum);
    int deleteOrder(Long orderNum);
}
