package com.aevum.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;
import java.util.Locale;

@Configuration
public class I18nConfig {

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.forLanguageTag("pt-BR"));
        resolver.setSupportedLocales(List.of(
            Locale.forLanguageTag("pt-BR"),
            Locale.forLanguageTag("pt"),
            Locale.ENGLISH,
            Locale.US
        ));
        return resolver;
    }
}
