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

    public List<SupplierDto> findAll() {
        return supplierMapper.findAll();
    }

    public SupplierDto create(SupplierRequestDto req) {
        if (supplierMapper.countBySupName(req.getSupName()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 매입처명입니다");
        }
        SupplierVo vo = new SupplierVo();
        vo.setSupName(req.getSupName());
        supplierMapper.insert(vo);
        return supplierMapper.findBySupNum(vo.getSupNum());
    }

    public SupplierDto update(Long supNum, SupplierRequestDto req) {
        SupplierDto current = supplierMapper.findBySupNum(supNum);
        if (current == null) {
            throw new IllegalArgumentException("존재하지 않는 매입처입니다");
        }
        if (!req.getSupName().equals(current.getSupName())
                && supplierMapper.countBySupName(req.getSupName()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 매입처명입니다");
        }
        SupplierVo vo = new SupplierVo();
        vo.setSupNum(supNum);
        vo.setSupName(req.getSupName());
        supplierMapper.update(vo);
        return supplierMapper.findBySupNum(supNum);
    }

    public void delete(Long supNum) {
        supplierMapper.delete(supNum);
    }
}
