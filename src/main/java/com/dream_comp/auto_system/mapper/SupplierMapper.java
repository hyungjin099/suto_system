package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.SupplierDto;
import com.dream_comp.auto_system.vo.SupplierVo;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface SupplierMapper {
    List<SupplierDto> findAll();
    SupplierDto findBySupNum(Long supNum);
    int countBySupName(String supName);
    void insert(SupplierVo vo);
    void update(SupplierVo vo);
    void delete(Long supNum);
}
