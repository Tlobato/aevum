package com.aevum.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AevumApplication {

	public static void main(String[] args) {
		SpringApplication.run(AevumApplication.class, args);
	}

}
