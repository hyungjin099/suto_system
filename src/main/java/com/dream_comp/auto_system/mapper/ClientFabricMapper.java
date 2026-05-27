package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.ClientFabricDto;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ClientFabricMapper {
    List<ClientFabricDto> findByUrlNum(int urlNum);
}
