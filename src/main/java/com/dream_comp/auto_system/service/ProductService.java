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
        if (productMapper.countByProdCode(req.getProdCode()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 제품코드입니다");
        }
        ProductVo vo = toVo(null, req);
        productMapper.insert(vo);
        return productMapper.findByProdNum(vo.getProdNum());
    }

    public ProductDto update(Long prodNum, ProductRequestDto req) {
        // 코드 변경 시 다른 행과의 중복만 검사
        ProductDto current = productMapper.findByProdNum(prodNum);
        if (current == null) {
            throw new IllegalArgumentException("존재하지 않는 제품입니다");
        }
        if (!req.getProdCode().equals(current.getProdCode())
                && productMapper.countByProdCode(req.getProdCode()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 제품코드입니다");
        }
        ProductVo vo = toVo(prodNum, req);
        productMapper.update(vo);
        return productMapper.findByProdNum(prodNum);
    }

    public void delete(Long prodNum) {
        int aliasCount = productMapper.countAliasByProdNum(prodNum);
        if (aliasCount > 0) {
            throw new IllegalArgumentException(
                "거래처에 별칭 " + aliasCount + "건이 등록되어 있어 삭제할 수 없습니다. " +
                "거래처 별칭을 먼저 정리해 주세요."
            );
        }
        productMapper.delete(prodNum);
    }

    private ProductVo toVo(Long prodNum, ProductRequestDto req) {
        ProductVo vo = new ProductVo();
        vo.setProdNum(prodNum);
        vo.setProdCode(req.getProdCode());
        vo.setProdName(req.getProdName());
        vo.setProdPrice(req.getProdPrice());
        vo.setManufacturer(req.getManufacturer());
        return vo;
    }
}
