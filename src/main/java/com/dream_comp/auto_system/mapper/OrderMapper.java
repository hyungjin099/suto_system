package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.vo.OrderItemVo;
import com.dream_comp.auto_system.vo.OrderVo;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OrderMapper {
    void insertOrder(OrderVo orderVo);
    void insertOrderItem(OrderItemVo itemVo);
}
