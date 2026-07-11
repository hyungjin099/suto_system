package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.ClientAliasAdminDto;
import com.dream_comp.auto_system.dto.ClientAliasRequestDto;
import com.dream_comp.auto_system.dto.ClientFabricDto;
import com.dream_comp.auto_system.mapper.ClientFabricMapper;
import com.dream_comp.auto_system.vo.ClientAliasVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientFabricService {

    private final ClientFabricMapper clientFabricMapper;

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
}
