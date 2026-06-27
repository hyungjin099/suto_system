package com.dream_comp.auto_system.mapper;

import com.dream_comp.auto_system.dto.AdminUserDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AdminUserMapper {
    AdminUserDto findByUsername(String username);
    int count();
    void insert(AdminUserDto dto);
    int updatePassword(@Param("adminNum") Long adminNum, @Param("password") String password);
}
