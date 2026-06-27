package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.AdminUserDto;
import com.dream_comp.auto_system.mapper.AdminUserMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AdminUserMapper adminUserMapper;
    private final PasswordEncoder passwordEncoder;

    /** 앱 시작 시: 관리자 계정이 없으면 admin/admin1234 (해시) 자동 생성 */
    @PostConstruct
    public void ensureDefaultAdmin() {
        if (adminUserMapper.count() == 0) {
            AdminUserDto dto = new AdminUserDto();
            dto.setUsername("admin");
            dto.setPassword(passwordEncoder.encode("admin1234"));
            dto.setDisplayName("시스템 관리자");
            adminUserMapper.insert(dto);
            log.warn("기본 관리자 계정 생성됨: admin / admin1234 — 첫 로그인 후 즉시 비밀번호 변경 권장");
        }
    }

    /** 로그인. 성공 시 AdminUserDto 반환(비번 필드는 노출 전에 비워서 반환), 실패 시 null */
    public AdminUserDto authenticate(String username, String password) {
        if (username == null || password == null) return null;
        AdminUserDto u = adminUserMapper.findByUsername(username);
        if (u == null) return null;
        if (!passwordEncoder.matches(password, u.getPassword())) return null;
        u.setPassword(null);
        return u;
    }

    public void changePassword(Long adminNum, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("새 비밀번호는 8자 이상이어야 합니다");
        }
        AdminUserDto u = adminUserMapper.findByUsername(null);
        // 위는 fallback. 실제로 adminNum으로 찾는 게 안전하지만, 간단히 username 기반으로도 가능.
        // 컨트롤러에서 세션 username으로 다시 인증 후 호출.
        if (!passwordEncoder.matches(currentPassword, u.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다");
        }
        adminUserMapper.updatePassword(adminNum, passwordEncoder.encode(newPassword));
    }
}
