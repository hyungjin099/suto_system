package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.PopupDto;
import com.dream_comp.auto_system.dto.PopupPublicDto;
import com.dream_comp.auto_system.vo.PopupVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface PopupMapper {
    List<PopupDto> findAll();
    PopupDto findByPopupNum(Long popupNum);
    List<String> findTargets(Long popupNum);
    void insert(PopupVo vo);
    void update(PopupVo vo);
    void updateUse(@Param("popupNum") Long popupNum, @Param("useYn") String useYn);
    void delete(Long popupNum);
    void deleteTargets(Long popupNum);
    void insertTargets(@Param("popupNum") Long popupNum, @Param("cliCodes") List<String> cliCodes);
    PopupPublicDto findActiveFor(@Param("cliCode") String cliCode, @Param("now") LocalDateTime now);
}
