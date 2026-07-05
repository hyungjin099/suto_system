package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.AdminUserDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminUserMapper {
    AdminUserDto findByUsername(String username);
    AdminUserDto findByAdminNum(@Param("adminNum") Long adminNum);
    int count();
    void insert(AdminUserDto dto);
    int updatePassword(@Param("adminNum") Long adminNum,
                       @Param("password") String password,
                       @Param("resetRequired") String resetRequired);
    int updateUseYn(@Param("adminNum") Long adminNum, @Param("useYn") String useYn);
    List<AdminUserDto> findAll();
}
