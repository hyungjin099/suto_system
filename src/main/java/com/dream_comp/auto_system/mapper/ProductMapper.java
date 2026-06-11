package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.ProductDto;
import com.dream_comp.auto_system.vo.ProductVo;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ProductMapper {
    List<ProductDto> findAllActive();
    void insert(ProductVo vo);
    void update(ProductVo vo);
    void deactivate(Long prodNum); // soft delete: PROD_STATUS = 0
}
