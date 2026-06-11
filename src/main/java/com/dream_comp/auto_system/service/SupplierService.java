package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.SupplierDto;
import com.dream_comp.auto_system.dto.SupplierRequestDto;
import com.dream_comp.auto_system.mapper.SupplierMapper;
import com.dream_comp.auto_system.vo.SupplierVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierMapper supplierMapper;

    public List<SupplierDto> findAllActive() {
        return supplierMapper.findAllActive();
    }

    public SupplierDto create(SupplierRequestDto req) {
        SupplierVo vo = toVo(null, req);
        supplierMapper.insert(vo);
        return findAllActive().stream()
                .filter(s -> s.getSupNum().equals(vo.getSupNum()))
                .findFirst()
                .orElseThrow();
    }

    public SupplierDto update(Long supNum, SupplierRequestDto req) {
        SupplierVo vo = toVo(supNum, req);
        supplierMapper.update(vo);
        return findAllActive().stream()
                .filter(s -> s.getSupNum().equals(supNum))
                .findFirst()
                .orElseThrow();
    }

    public void deactivate(Long supNum) {
        supplierMapper.deactivate(supNum);
    }

    private SupplierVo toVo(Long supNum, SupplierRequestDto req) {
        SupplierVo vo = new SupplierVo();
        vo.setSupNum(supNum);
        vo.setSupName(req.getSupName());
        vo.setSupTel(req.getSupTel());
        vo.setSupManagerName(req.getSupManagerName());
        vo.setSupManagerTel(req.getSupManagerTel());
        return vo;
    }
}
