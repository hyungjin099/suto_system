package com.dream_comp.auto_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SystemSettingMapper {
    String findValue(@Param("key") String key);
    List<Map<String, Object>> findAll();
    int upsert(@Param("key") String key,
               @Param("value") String value,
               @Param("actor") String actor);
}
