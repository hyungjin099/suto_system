package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.ClientAliasAdminDto;
import com.dream_comp.auto_system.dto.ClientFabricDto;
import com.dream_comp.auto_system.vo.ClientAliasVo;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ClientFabricMapper {
    // 주문 폼용 (CLI_CODE 기반)
    List<ClientFabricDto> findByCliCode(String cliCode);

    // 관리자 페이지용 (CLI_NUM 기반, ALIAS_NUM 포함)
    List<ClientAliasAdminDto> findAdminByCliNum(Long cliNum);
    int countByCliAndProd(Long cliNum, Long prodNum);
    int countByCliAndName(Long cliNum, String clientFabName);
    int countByCliAndNameExcept(Long cliNum, String clientFabName, Long aliasNum);
    ClientAliasAdminDto findAdminByAliasNum(Long aliasNum);
    void insert(ClientAliasVo vo);
    void update(ClientAliasVo vo);
    void delete(Long aliasNum);
}
