package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.SupplierDto;
import com.dream_comp.auto_system.dto.SupplierRequestDto;
import com.dream_comp.auto_system.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<SupplierDto>> getAll() {
        return ResponseEntity.ok(supplierService.findAll());
    }

    @PostMapping
    public ResponseEntity<SupplierDto> create(@Valid @RequestBody SupplierRequestDto req) {
        return ResponseEntity.ok(supplierService.create(req));
    }

    @PutMapping("/{supNum}")
    public ResponseEntity<SupplierDto> update(@PathVariable Long supNum,
                                              @Valid @RequestBody SupplierRequestDto req) {
        return ResponseEntity.ok(supplierService.update(supNum, req));
    }

    @DeleteMapping("/{supNum}")
    public ResponseEntity<Void> delete(@PathVariable Long supNum) {
        supplierService.delete(supNum);
        return ResponseEntity.noContent().build();
    }
}
