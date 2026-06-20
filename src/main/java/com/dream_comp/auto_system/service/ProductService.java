package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.ProductDto;
import com.dream_comp.auto_system.dto.ProductRequestDto;
import com.dream_comp.auto_system.mapper.ProductMapper;
import com.dream_comp.auto_system.vo.ProductVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductMapper productMapper;

    public List<ProductDto> findAll() {
        return productMapper.findAll();
    }

    public ProductDto create(ProductRequestDto req) {
        ProductVo vo = new ProductVo();
        vo.setProdCode(req.getProdCode());
        vo.setProdName(req.getProdName());
        vo.setProdPrice(req.getProdPrice());
        vo.setManufacturer(req.getManufacturer());
        productMapper.insert(vo);

        return findAll().stream()
                .filter(p -> p.getProdNum().equals(vo.getProdNum()))
                .findFirst()
                .orElseThrow();
    }

    public ProductDto update(Long prodNum, ProductRequestDto req) {
        ProductVo vo = new ProductVo();
        vo.setProdNum(prodNum);
        vo.setProdCode(req.getProdCode());
        vo.setProdName(req.getProdName());
        vo.setProdPrice(req.getProdPrice());
        vo.setManufacturer(req.getManufacturer());
        productMapper.update(vo);

        return findAll().stream()
                .filter(p -> p.getProdNum().equals(prodNum))
                .findFirst()
                .orElseThrow();
    }

    public void delete(Long prodNum) {
        productMapper.delete(prodNum);
    }
}
