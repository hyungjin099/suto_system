package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.ClientAliasAdminDto;
import com.dream_comp.auto_system.dto.ClientFabricDto;
import com.dream_comp.auto_system.vo.ClientAliasVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ClientFabricMapper {
    // 주문 폼용 (CLI_CODE 기반)
    List<ClientFabricDto> findByCliCode(String cliCode);

    /**
     * 가격 스냅샷용: (거래처 + 원단코드 + 별칭명) 조합으로 정확한 별칭 1건 조회.
     * 같은 원단에 별칭이 여러 개일 수 있으므로 별칭명까지 넘겨야 함.
     */
    ClientFabricDto findOneByCliCodeProdCodeAndAlias(@Param("cliCode") String cliCode,
                                                     @Param("prodCode") String prodCode,
                                                     @Param("aliasName") String aliasName);

    // 관리자 페이지용 (CLI_NUM 기반, ALIAS_NUM 포함)
    List<ClientAliasAdminDto> findAdminByCliNum(Long cliNum);
    List<java.util.Map<String, Object>> countAllByCli();
    int countByCliAndName(@Param("cliNum") Long cliNum, @Param("clientFabName") String clientFabName);
    int countByCliAndNameExcept(@Param("cliNum") Long cliNum, @Param("clientFabName") String clientFabName, @Param("aliasNum") Long aliasNum);
    ClientAliasAdminDto findAdminByAliasNum(Long aliasNum);
    void insert(ClientAliasVo vo);
    void update(ClientAliasVo vo);
    void delete(Long aliasNum);
}
