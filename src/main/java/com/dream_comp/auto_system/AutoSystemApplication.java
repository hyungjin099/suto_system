package com.dream_comp.auto_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AutoSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(AutoSystemApplication.class, args);
	}

}
