package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.ProductDto;
import com.dream_comp.auto_system.vo.ProductVo;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ProductMapper {
    List<ProductDto> findAll();
    ProductDto findByProdNum(Long prodNum);
    int countByProdCode(String prodCode);
    int countAliasByProdNum(Long prodNum); // 자식(별칭) 존재 여부
    void insert(ProductVo vo);
    void update(ProductVo vo);
    void updateStatus(@org.apache.ibatis.annotations.Param("prodNum") Long prodNum,
                      @org.apache.ibatis.annotations.Param("prodStatus") String prodStatus);
    void delete(Long prodNum);
}
