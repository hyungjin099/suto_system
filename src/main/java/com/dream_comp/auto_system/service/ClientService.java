package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.ClientDto;
import com.dream_comp.auto_system.dto.ClientRequestDto;
import com.dream_comp.auto_system.mapper.ClientMapper;
import com.dream_comp.auto_system.vo.ClientVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientMapper clientMapper;

    public List<ClientDto> findAll() {
        return clientMapper.findAll();
    }

    public ClientDto create(ClientRequestDto req) {
        if (clientMapper.countByCliCode(req.getCliCode()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 거래처코드입니다");
        }
        ClientVo vo = toVo(null, req);
        clientMapper.insert(vo);
        return clientMapper.findByCliNum(vo.getCliNum());
    }

    public ClientDto update(Long cliNum, ClientRequestDto req) {
        ClientVo vo = toVo(cliNum, req);
        clientMapper.update(vo);
        return clientMapper.findByCliNum(cliNum);
    }

private ClientVo toVo(Long cliNum, ClientRequestDto req) {
        ClientVo vo = new ClientVo();
        vo.setCliNum(cliNum);
        vo.setCliCode(req.getCliCode());
        vo.setCliCompName(req.getCliCompName());
        vo.setCliCeoName(req.getCliCeoName());
        vo.setCliTel(req.getCliTel());
        vo.setCliFax(req.getCliFax());
        vo.setCliManagerName(req.getCliManagerName());
        vo.setCliManagerTel(req.getCliManagerTel());
        vo.setCliEmail(req.getCliEmail());
        vo.setCliAddress(req.getCliAddress());
        vo.setCliUseType(req.getCliUseType());
        return vo;
    }
}
