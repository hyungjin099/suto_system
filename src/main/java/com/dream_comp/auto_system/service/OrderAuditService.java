package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.OrderAuditDto;
import com.dream_comp.auto_system.mapper.OrderAuditMapper;
import com.dream_comp.auto_system.util.AdminContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderAuditService {

    private final OrderAuditMapper orderAuditMapper;
    private final ObjectMapper objectMapper;

    public void log(String action, Long orderNum, Long itemNum,
                    Object before, Object after, String memo) {
        try {
            OrderAuditDto dto = new OrderAuditDto();
            dto.setOrderNum(orderNum);
            dto.setItemNum(itemNum);
            dto.setAction(action);
            dto.setActor(AdminContext.currentActor());
            dto.setBeforeJson(before == null ? null : objectMapper.writeValueAsString(before));
            dto.setAfterJson(after  == null ? null : objectMapper.writeValueAsString(after));
            dto.setMemo(memo);
            orderAuditMapper.insert(dto);
        } catch (Exception e) {
            // audit 실패는 비즈니스 흐름을 깨지 않음 — 경고만
            log.warn("Audit 기록 실패 (action={}, orderNum={}): {}", action, orderNum, e.getMessage());
        }
    }

    public List<OrderAuditDto> findByOrderNum(Long orderNum) {
        return orderAuditMapper.findByOrderNum(orderNum);
    }
}
