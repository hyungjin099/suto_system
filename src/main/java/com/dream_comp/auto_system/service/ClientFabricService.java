package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.ClientFabricDto;
import com.dream_comp.auto_system.mapper.ClientFabricMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientFabricService {

    private final ClientFabricMapper clientFabricMapper;

    public List<ClientFabricDto> findByUrlNum(int urlNum) {
        return clientFabricMapper.findByUrlNum(urlNum);
    }
}
