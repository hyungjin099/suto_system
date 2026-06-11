package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.SupplierDto;
import com.dream_comp.auto_system.vo.SupplierVo;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface SupplierMapper {
    List<SupplierDto> findAllActive();
    void insert(SupplierVo vo);
    void update(SupplierVo vo);
    void deactivate(Long supNum);
}
