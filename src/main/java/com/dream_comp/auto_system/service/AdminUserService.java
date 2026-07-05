package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.AdminUserDto;
import com.dream_comp.auto_system.mapper.AdminUserMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    public static final String SUPER_ADMIN_USERNAME = "admin";
    public static final String DEFAULT_NEW_PASSWORD = "1234";
    private static final int MIN_PASSWORD_LEN = 8;

    private final AdminUserMapper adminUserMapper;
    private final PasswordEncoder passwordEncoder;

    /** 앱 시작 시: 관리자 계정이 없으면 admin/admin1234 (해시) 자동 생성 */
    @PostConstruct
    public void ensureDefaultAdmin() {
        if (adminUserMapper.count() == 0) {
            AdminUserDto dto = new AdminUserDto();
            dto.setUsername(SUPER_ADMIN_USERNAME);
            dto.setPassword(passwordEncoder.encode("admin1234"));
            dto.setDisplayName("시스템 관리자");
            dto.setPasswordResetRequired("Y");
            dto.setUseYn("Y");
            adminUserMapper.insert(dto);
            log.warn("기본 관리자 계정 생성됨: admin / admin1234 — 첫 로그인 시 비밀번호 변경 강제됨");
        }
    }

    public static boolean isSuperAdmin(AdminUserDto u) {
        return u != null && SUPER_ADMIN_USERNAME.equals(u.getUsername());
    }

    /**
     * 로그인.
     * 성공 시 AdminUserDto 반환(비번 필드는 노출 전에 비워서 반환), 실패 시 null.
     * USE_YN='N' 계정은 로그인 실패로 처리.
     */
    public AdminUserDto authenticate(String username, String password) {
        if (username == null || password == null) return null;
        AdminUserDto u = adminUserMapper.findByUsername(username);
        if (u == null) return null;
        if (!"Y".equalsIgnoreCase(u.getUseYn())) return null;
        if (!passwordEncoder.matches(password, u.getPassword())) return null;
        u.setPassword(null);
        return u;
    }

    /** 본인 비번 변경. 성공 시 세션 갱신용으로 갱신된 DTO 반환 */
    public AdminUserDto changeOwnPassword(Long adminNum, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < MIN_PASSWORD_LEN) {
            throw new IllegalArgumentException("새 비밀번호는 " + MIN_PASSWORD_LEN + "자 이상이어야 합니다");
        }
        if (newPassword.equals(currentPassword)) {
            throw new IllegalArgumentException("새 비밀번호는 현재 비밀번호와 달라야 합니다");
        }
        AdminUserDto u = adminUserMapper.findByAdminNum(adminNum);
        if (u == null) throw new IllegalArgumentException("계정을 찾을 수 없습니다");
        if (!"Y".equalsIgnoreCase(u.getUseYn())) throw new IllegalStateException("비활성화된 계정입니다");
        if (!passwordEncoder.matches(currentPassword, u.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다");
        }
        adminUserMapper.updatePassword(adminNum, passwordEncoder.encode(newPassword), "N");
        u.setPassword(null);
        u.setPasswordResetRequired("N");
        return u;
    }

    // ===== 최고 관리자(admin) 전용 =====

    public List<AdminUserDto> listAll() {
        List<AdminUserDto> list = adminUserMapper.findAll();
        list.forEach(a -> a.setPassword(null));
        return list;
    }

    /** username만 받아 신규 계정 생성. 비번 = "1234"(해시), 최초 로그인 시 변경 강제 */
    public AdminUserDto createByAdmin(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("아이디를 입력하세요");
        }
        String u = username.trim();
        if (u.length() > 50) throw new IllegalArgumentException("아이디는 50자 이내여야 합니다");
        if (!u.matches("^[A-Za-z0-9._-]{3,50}$")) {
            throw new IllegalArgumentException("아이디는 영문/숫자/._- 만 사용, 3~50자");
        }
        if (SUPER_ADMIN_USERNAME.equalsIgnoreCase(u)) {
            throw new IllegalArgumentException("사용할 수 없는 아이디입니다");
        }
        if (adminUserMapper.findByUsername(u) != null) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다");
        }
        AdminUserDto dto = new AdminUserDto();
        dto.setUsername(u);
        dto.setPassword(passwordEncoder.encode(DEFAULT_NEW_PASSWORD));
        dto.setDisplayName(u);
        dto.setPasswordResetRequired("Y");
        dto.setUseYn("Y");
        adminUserMapper.insert(dto);
        dto.setPassword(null);
        return dto;
    }

    /** admin 본인은 비활성화 불가. 그 외 계정 활성/비활성 토글 */
    public AdminUserDto setActive(Long adminNum, boolean active) {
        AdminUserDto u = adminUserMapper.findByAdminNum(adminNum);
        if (u == null) throw new IllegalArgumentException("계정을 찾을 수 없습니다");
        if (SUPER_ADMIN_USERNAME.equals(u.getUsername())) {
            throw new IllegalArgumentException("최고 관리자 계정은 상태를 변경할 수 없습니다");
        }
        adminUserMapper.updateUseYn(adminNum, active ? "Y" : "N");
        u.setUseYn(active ? "Y" : "N");
        u.setPassword(null);
        return u;
    }
}
