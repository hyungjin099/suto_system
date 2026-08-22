package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.ClientAliasAdminDto;
import com.dream_comp.auto_system.dto.ClientAliasRequestDto;
import com.dream_comp.auto_system.dto.ClientFabricDto;
import com.dream_comp.auto_system.dto.ProductDto;
import com.dream_comp.auto_system.mapper.ClientFabricMapper;
import com.dream_comp.auto_system.mapper.ProductMapper;
import com.dream_comp.auto_system.vo.ClientAliasVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientFabricService {

    private final ClientFabricMapper clientFabricMapper;
    private final ProductMapper productMapper;

    public List<ClientFabricDto> findByCliCode(String cliCode) {
        return clientFabricMapper.findByCliCode(cliCode);
    }

    public List<ClientAliasAdminDto> findAdminByCliNum(Long cliNum) {
        return clientFabricMapper.findAdminByCliNum(cliNum);
    }

    public java.util.Map<Long, Integer> countAllByCli() {
        java.util.Map<Long, Integer> result = new java.util.HashMap<>();
        for (java.util.Map<String, Object> row : clientFabricMapper.countAllByCli()) {
            Number cli = (Number) row.get("cliNum");
            Number cnt = (Number) row.get("cnt");
            if (cli != null) result.put(cli.longValue(), cnt == null ? 0 : cnt.intValue());
        }
        return result;
    }

    public ClientAliasAdminDto create(ClientAliasRequestDto req) {
        // 같은 원단에 여러 별칭 등록 허용 (2026-07 정책 변경)
        // 단, 별칭명 자체는 거래처 내에서 유일해야 함
        if (clientFabricMapper.countByCliAndName(req.getCliNum(), req.getClientFabName()) > 0) {
            throw new IllegalArgumentException("같은 거래처 내에서 이미 사용 중인 별칭입니다");
        }
        ClientAliasVo vo = new ClientAliasVo();
        vo.setCliNum(req.getCliNum());
        vo.setProdNum(req.getProdNum());
        vo.setClientFabName(req.getClientFabName());
        vo.setClientFabPrice(req.getClientFabPrice());
        clientFabricMapper.insert(vo);
        return clientFabricMapper.findAdminByAliasNum(vo.getAliasNum());
    }

    public ClientAliasAdminDto update(Long aliasNum, ClientAliasRequestDto req) {
        ClientAliasAdminDto current = clientFabricMapper.findAdminByAliasNum(aliasNum);
        if (current == null) {
            throw new IllegalArgumentException("존재하지 않는 별칭입니다");
        }
        if (clientFabricMapper.countByCliAndNameExcept(
                current.getCliNum(), req.getClientFabName(), aliasNum) > 0) {
            throw new IllegalArgumentException("같은 거래처 내에서 이미 사용 중인 별칭입니다");
        }
        ClientAliasVo vo = new ClientAliasVo();
        vo.setAliasNum(aliasNum);
        vo.setClientFabName(req.getClientFabName());
        vo.setClientFabPrice(req.getClientFabPrice());
        clientFabricMapper.update(vo);
        return clientFabricMapper.findAdminByAliasNum(aliasNum);
    }

    public void delete(Long aliasNum) {
        clientFabricMapper.delete(aliasNum);
    }

    /**
     * 여러 원단을 한 거래처에 일괄 별칭 등록.
     * 각 별칭은 원단의 공식명(PROD_NAME) + 공식단가(PROD_PRICE)로 등록됨.
     * 이미 (거래처, 별칭명) 중복 등 오류가 생기는 원단은 스킵하고 결과에 기록.
     */
    @Transactional
    public BulkCreateResult createBulk(Long cliNum, List<Long> prodNums) {
        List<ClientAliasAdminDto> created = new ArrayList<>();
        List<Map<String, Object>> skipped = new ArrayList<>();

        for (Long prodNum : prodNums) {
            ProductDto p = productMapper.findByProdNum(prodNum);
            if (p == null) {
                Map<String, Object> s = new HashMap<>();
                s.put("prodNum", prodNum);
                s.put("reason", "원단을 찾을 수 없음");
                skipped.add(s);
                continue;
            }

            String aliasName = p.getProdName();
            Integer price = p.getProdPrice();

            // (거래처, 별칭명) 중복 방지
            if (clientFabricMapper.countByCliAndName(cliNum, aliasName) > 0) {
                Map<String, Object> s = new HashMap<>();
                s.put("prodNum", prodNum);
                s.put("prodName", p.getProdName());
                s.put("reason", "동일 별칭명 이미 사용 중");
                skipped.add(s);
                continue;
            }

            ClientAliasVo vo = new ClientAliasVo();
            vo.setCliNum(cliNum);
            vo.setProdNum(prodNum);
            vo.setClientFabName(aliasName);
            vo.setClientFabPrice(price);
            clientFabricMapper.insert(vo);
            created.add(clientFabricMapper.findAdminByAliasNum(vo.getAliasNum()));
        }

        BulkCreateResult r = new BulkCreateResult();
        r.created = created;
        r.skipped = skipped;
        return r;
    }

    /** 일괄 등록 결과 DTO (created 성공 목록, skipped 실패/스킵 목록) */
    public static class BulkCreateResult {
        public List<ClientAliasAdminDto> created;
        public List<Map<String, Object>> skipped;
    }
}
