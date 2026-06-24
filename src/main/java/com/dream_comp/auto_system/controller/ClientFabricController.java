package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.ClientAliasAdminDto;
import com.dream_comp.auto_system.dto.ClientAliasRequestDto;
import com.dream_comp.auto_system.dto.ClientFabricDto;
import com.dream_comp.auto_system.service.ClientFabricService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ClientFabricController {

    private final ClientFabricService clientFabricService;

    /** 주문 폼: CLI_CODE로 별칭 조회 */
    @GetMapping("/api/clients/{cliCode}/fabrics")
    public ResponseEntity<List<ClientFabricDto>> getFabrics(@PathVariable String cliCode) {
        return ResponseEntity.ok(clientFabricService.findByCliCode(cliCode));
    }

    /** 관리자: CLI_NUM으로 별칭 전체 조회 */
    @GetMapping("/api/aliases")
    public ResponseEntity<List<ClientAliasAdminDto>> getAliases(@RequestParam Long cliNum) {
        return ResponseEntity.ok(clientFabricService.findAdminByCliNum(cliNum));
    }

    /** 관리자: 거래처별 별칭 갯수 일괄 조회 ({cliNum: count}) */
    @GetMapping("/api/aliases/counts")
    public ResponseEntity<java.util.Map<Long, Integer>> getCounts() {
        return ResponseEntity.ok(clientFabricService.countAllByCli());
    }

    /** 관리자: 별칭 신규 등록 */
    @PostMapping("/api/aliases")
    public ResponseEntity<ClientAliasAdminDto> create(@Valid @RequestBody ClientAliasRequestDto req) {
        return ResponseEntity.ok(clientFabricService.create(req));
    }

    /** 관리자: 별칭 수정 (이름/단가) */
    @PutMapping("/api/aliases/{aliasNum}")
    public ResponseEntity<ClientAliasAdminDto> update(@PathVariable Long aliasNum,
                                                      @Valid @RequestBody ClientAliasRequestDto req) {
        return ResponseEntity.ok(clientFabricService.update(aliasNum, req));
    }

    /** 관리자: 별칭 삭제 (매칭 해제) */
    @DeleteMapping("/api/aliases/{aliasNum}")
    public ResponseEntity<Void> delete(@PathVariable Long aliasNum) {
        clientFabricService.delete(aliasNum);
        return ResponseEntity.noContent().build();
    }
}
