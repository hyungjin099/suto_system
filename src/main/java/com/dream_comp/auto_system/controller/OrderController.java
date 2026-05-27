package com.dream_comp.auto_system.controller;

import com.dream_comp.auto_system.dto.OrderRequestDto;
import com.dream_comp.auto_system.dto.OrderResponseDto;
import com.dream_comp.auto_system.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponseDto> submit(@RequestBody OrderRequestDto dto) {
        return ResponseEntity.ok(orderService.submitOrder(dto));
    }
}
