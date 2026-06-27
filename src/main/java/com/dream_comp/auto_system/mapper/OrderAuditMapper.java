package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.OrderAuditDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface OrderAuditMapper {
    void insert(OrderAuditDto dto);
    List<OrderAuditDto> findByOrderNum(@Param("orderNum") Long orderNum);
}
