package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.ClientDto;
import com.dream_comp.auto_system.vo.ClientVo;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ClientMapper {
    List<ClientDto> findAll();
    ClientDto findByCliNum(Long cliNum);
    void insert(ClientVo vo);
    void update(ClientVo vo);
    void delete(Long cliNum);
}
