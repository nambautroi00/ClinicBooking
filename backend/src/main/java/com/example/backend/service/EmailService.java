package com.example.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendSimpleEmail(String to, String subject, String text) {
        if (to == null || to.isBlank()) {
            log.warn("Email to is null/blank, skipping send. subject={}", subject);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.debug("Sent email to {} subject={}", to, subject);
        } catch (Exception ex) {
            // if mail is not configured or fails, still log
            log.error("Failed to send email to {} subject={} error={}", to, subject, ex.getMessage());
        }
    }
}
