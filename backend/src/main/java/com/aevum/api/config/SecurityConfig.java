package com.aevum.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable()) // Desabilitado para chamadas REST API e LocalStack mock
            .authorizeHttpRequests(authz -> authz
                // Webhook do Stripe: vem do servidor deles, não do browser. Liberado aqui, a segurança é pelo HMAC.
                .requestMatchers("/api/v1/payments/webhook").permitAll()
                // Webhook do Clerk: vem do servidor do Clerk. Liberado aqui, a segurança é pelo Svix.
                .requestMatchers("/api/v1/webhooks/clerk").permitAll()
                // Endpoints públicos via token (acesso para destinatários sem conta)
                .requestMatchers("/api/v1/public/**").permitAll()
                // Todos os outros endpoints de cápsulas e pagamentos exigem JWT válido do Clerk
                .requestMatchers("/api/v1/capsules/**").authenticated()
                .requestMatchers("/api/v1/payments/**").authenticated()
                .anyRequest().permitAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
