package com.example.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.example.backend.model.User;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendSimpleEmail(String to, String subject, String text) {
        System.out.println("📧 EmailService.sendSimpleEmail() called");
        System.out.println("📧 To: " + to);
        System.out.println("📧 Subject: " + subject);
        System.out.println("📧 Text length: " + (text != null ? text.length() : 0));
        
        if (to == null || to.isBlank()) {
            System.out.println("⚠️ Email to is null/blank, skipping send");
            log.warn("Email to is null/blank, skipping send. subject={}", subject);
            return;
        }
        
        try {
            System.out.println("📧 Creating SimpleMailMessage...");
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            System.out.println("📧 Sending email via JavaMailSender...");
            mailSender.send(message);
            
            System.out.println("✅ Email sent successfully to: " + to);
            log.debug("Sent email to {} subject={}", to, subject);
        } catch (Exception ex) {
            System.err.println("❌ FAILED to send email to " + to + ": " + ex.getMessage());
            ex.printStackTrace();
            // if mail is not configured or fails, still log
            log.error("Failed to send email to {} subject={} error={}", to, subject, ex.getMessage());
        }
    }

    // Convenience helper for welcome emails
    public void sendWelcomeEmail(User user) {
        if (user == null) return;
        String to = user.getEmail();
        String fullName = (user.getFirstName() != null ? user.getFirstName() : "")
                + (user.getLastName() != null ? (" " + user.getLastName()) : "");
        String subject = "Chào mừng bạn đến với ClinicBooking";
        String body = "Xin chào " + (fullName.trim().isEmpty() ? "bạn" : fullName.trim()) + ",\n\n" +
                "Tài khoản của bạn đã được tạo thành công.\n" +
                "Bạn có thể đăng nhập và quản lý hồ sơ khám bệnh, đặt lịch hẹn nhanh chóng.\n\n" +
                "Trân trọng,\nClinicBooking";
        sendSimpleEmail(to, subject, body);
    }
}
