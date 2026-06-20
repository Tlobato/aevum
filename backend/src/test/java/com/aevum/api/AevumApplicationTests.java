package com.aevum.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.MessageSource;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class AevumApplicationTests {

	@Autowired
	private MessageSource messageSource;

	@Test
	void contextLoads() {
	}

	@Test
	void testLocaleResolution() {
		// pt-BR should resolve to Portuguese text in messages.properties
		String ptSubject = messageSource.getMessage("email.sealing.subject", new Object[]{"Teste"}, Locale.forLanguageTag("pt-BR"));
		assertEquals("Selo da Eternidade Ativado: Teste", ptSubject);

		// en should resolve to English text in messages_en.properties
		String enSubject = messageSource.getMessage("email.sealing.subject", new Object[]{"Test"}, Locale.ENGLISH);
		assertEquals("Seal of Eternity Activated: Test", enSubject);

		// Unknown/System default fallback should result in default (Portuguese) since fallbackToSystemLocale is false
		String unknownSubject = messageSource.getMessage("email.sealing.subject", new Object[]{"Fallback"}, Locale.GERMAN);
		assertEquals("Selo da Eternidade Ativado: Fallback", unknownSubject);
	}

}
