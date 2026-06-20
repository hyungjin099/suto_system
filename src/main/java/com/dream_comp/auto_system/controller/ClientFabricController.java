package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.ClientFabricDto;
import com.dream_comp.auto_system.service.ClientFabricService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientFabricController {

    private final ClientFabricService clientFabricService;

    /**
     * 고객사 거래처코드(CLI_CODE)로 해당 고객사에 등록된 원단 별칭 목록 반환.
     * 주문 폼의 셀렉트박스 옵션 생성에 사용.
     */
    @GetMapping("/{cliCode}/fabrics")
    public ResponseEntity<List<ClientFabricDto>> getFabrics(@PathVariable String cliCode) {
        return ResponseEntity.ok(clientFabricService.findByCliCode(cliCode));
    }
}
