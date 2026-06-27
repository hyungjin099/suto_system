package com.dream_comp.auto_system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminLoginDto {
    @NotBlank private String username;
    @NotBlank private String password;
}
