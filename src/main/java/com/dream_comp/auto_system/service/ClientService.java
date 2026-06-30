package com.dream_comp.auto_system.service;

import com.dream_comp.auto_system.dto.ClientDto;
import com.dream_comp.auto_system.dto.ClientRequestDto;
import com.dream_comp.auto_system.mapper.ClientMapper;
import com.dream_comp.auto_system.vo.ClientVo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientService {

    public static final String DEFAULT_PASSWORD = "1234";

    private final ClientMapper clientMapper;
    private final PasswordEncoder passwordEncoder;

    public List<ClientDto> findAll() {
        return clientMapper.findAll();
    }

    public com.dream_comp.auto_system.dto.ClientPublicDto findPublicByCliCode(String cliCode) {
        return clientMapper.findPublicByCliCode(cliCode);
    }

    public ClientDto create(ClientRequestDto req) {
        if (clientMapper.countByCliCode(req.getCliCode()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 거래처코드입니다");
        }
        ClientVo vo = toVo(null, req);
        clientMapper.insert(vo);
        // DB DEFAULT '1234'가 들어간 상태를 해시로 교체
        clientMapper.updatePasswordByCliCode(req.getCliCode(), passwordEncoder.encode(DEFAULT_PASSWORD));
        return clientMapper.findByCliNum(vo.getCliNum());
    }

    public ClientDto update(Long cliNum, ClientRequestDto req) {
        ClientVo vo = toVo(cliNum, req);
        clientMapper.update(vo);
        return clientMapper.findByCliNum(cliNum);
    }

    /** 로그인. (ok, mustChangePassword). 지연 마이그레이션: 평문이면 해시로 교체 후 진행 */
    public java.util.Map<String, Object> login(String cliCode, String password) {
        String stored = clientMapper.findPasswordByCliCode(cliCode);
        if (stored == null) {
            throw new IllegalArgumentException("존재하지 않는 거래처입니다");
        }
        boolean isHash = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
        boolean ok = isHash
                ? passwordEncoder.matches(password, stored)
                : stored.equals(password);
        if (!ok) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다");
        }
        boolean wasDefault = isHash
                ? passwordEncoder.matches(DEFAULT_PASSWORD, stored)
                : DEFAULT_PASSWORD.equals(stored);
        if (!isHash) {
            // 평문 → 해시로 lazy migration
            clientMapper.updatePasswordByCliCode(cliCode, passwordEncoder.encode(stored));
        }
        java.util.Map<String, Object> r = new java.util.HashMap<>();
        r.put("ok", true);
        r.put("mustChangePassword", wasDefault);
        return r;
    }

    public void changePassword(String cliCode, String currentPassword, String newPassword) {
        String stored = clientMapper.findPasswordByCliCode(cliCode);
        if (stored == null) throw new IllegalArgumentException("존재하지 않는 거래처입니다");

        boolean isHash = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
        boolean ok = isHash
                ? passwordEncoder.matches(currentPassword, stored)
                : stored.equals(currentPassword);
        if (!ok) throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다");

        if (newPassword == null || newPassword.length() < 4)
            throw new IllegalArgumentException("새 비밀번호는 4자 이상이어야 합니다");
        if (DEFAULT_PASSWORD.equals(newPassword))
            throw new IllegalArgumentException("기본 비밀번호로는 변경할 수 없습니다");

        clientMapper.updatePasswordByCliCode(cliCode, passwordEncoder.encode(newPassword));
    }

    public void resetPassword(Long cliNum) {
        int updated = clientMapper.updatePasswordByCliNum(cliNum, passwordEncoder.encode(DEFAULT_PASSWORD));
        if (updated == 0) throw new IllegalArgumentException("존재하지 않는 거래처입니다");
    }

    private ClientVo toVo(Long cliNum, ClientRequestDto req) {
        ClientVo vo = new ClientVo();
        vo.setCliNum(cliNum);
        vo.setCliCode(req.getCliCode());
        vo.setCliCompName(req.getCliCompName());
        vo.setCliCeoName(req.getCliCeoName());
        vo.setCliTel(req.getCliTel());
        vo.setCliFax(req.getCliFax());
        vo.setCliManagerName(req.getCliManagerName());
        vo.setCliManagerTel(req.getCliManagerTel());
        vo.setCliEmail(req.getCliEmail());
        vo.setCliAddress(req.getCliAddress());
        vo.setCliUseType(req.getCliUseType());
        return vo;
    }
}
