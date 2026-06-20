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

}
