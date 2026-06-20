package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.ProductDto;
import com.dream_comp.auto_system.dto.ProductRequestDto;
import com.dream_comp.auto_system.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAll() {
        return ResponseEntity.ok(productService.findAll());
    }

    @PostMapping
    public ResponseEntity<ProductDto> create(@Valid @RequestBody ProductRequestDto req) {
        return ResponseEntity.ok(productService.create(req));
    }

    @PutMapping("/{prodNum}")
    public ResponseEntity<ProductDto> update(@PathVariable Long prodNum,
                                             @Valid @RequestBody ProductRequestDto req) {
        return ResponseEntity.ok(productService.update(prodNum, req));
    }

    @DeleteMapping("/{prodNum}")
    public ResponseEntity<Void> delete(@PathVariable Long prodNum) {
        productService.delete(prodNum);
        return ResponseEntity.noContent().build();
    }
}
