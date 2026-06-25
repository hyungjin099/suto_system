package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.ClientDto;
import com.dream_comp.auto_system.dto.ClientRequestDto;
import com.dream_comp.auto_system.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<List<ClientDto>> getAll() {
        return ResponseEntity.ok(clientService.findAll());
    }

    @PostMapping
    public ResponseEntity<ClientDto> create(@Valid @RequestBody ClientRequestDto req) {
        return ResponseEntity.ok(clientService.create(req));
    }

    @PutMapping("/{cliNum}")
    public ResponseEntity<ClientDto> update(@PathVariable Long cliNum,
                                            @Valid @RequestBody ClientRequestDto req) {
        return ResponseEntity.ok(clientService.update(cliNum, req));
    }

    /** 주문 페이지 로그인 — 거래처코드 + 비밀번호 검증 */
    @PostMapping("/{cliCode}/login")
    public ResponseEntity<java.util.Map<String, Object>> login(
            @PathVariable String cliCode,
            @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(clientService.login(cliCode, body.get("password")));
    }

    /** 비밀번호 변경 — 현재 비번 검증 후 새 비번 설정 (4자 이상) */
    @PatchMapping("/{cliCode}/password")
    public ResponseEntity<java.util.Map<String, Object>> changePassword(
            @PathVariable String cliCode,
            @RequestBody java.util.Map<String, String> body) {
        clientService.changePassword(cliCode, body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok(java.util.Map.of("ok", true));
    }

    /** 관리자: 비밀번호 '1234'로 리셋 */
    @PatchMapping("/{cliNum}/reset-password")
    public ResponseEntity<java.util.Map<String, Object>> resetPassword(@PathVariable Long cliNum) {
        clientService.resetPassword(cliNum);
        return ResponseEntity.ok(java.util.Map.of("ok", true));
    }
}
