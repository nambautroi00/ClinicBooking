package com.example.backend.service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailOtpService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:noreply@clinic.com}")
    private String fromEmail;

    // Lưu OTP tạm thời trong memory (email -> otp)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    // Lưu pending patient registration (email -> PatientRegisterRequest)
    private final Map<String, com.example.backend.service.PatientService.PatientRegisterRequest> pendingRegistrations = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public boolean sendOtp(String email) {
        try {
            log.info("Starting OTP send process for email: {}", email);
            
            // Tạo OTP 6 số
            String otp = generateOtp();
            log.info("Generated OTP: {}", otp);
            
            // Lưu OTP vào memory với thời gian hết hạn 5 phút
            otpStorage.put(email, otp);
            scheduleOtpExpiry(email, 5); // 5 phút
            log.info("OTP stored in memory for email: {}", email);
            
            // Tạo email content
            String subject = "Mã xác thực OTP - ClinicBooking";
            String content = buildOtpEmailContent(otp);
            
            // Kiểm tra mail server configuration
            boolean mailConfigured = isMailServerConfigured();
            log.info("Mail server configured: {}", mailConfigured);
            log.info("From email: {}", fromEmail);
            log.info("Mail sender: {}", mailSender != null ? "Available" : "Null");
            
            // Gửi email (có thể simulate nếu không có mail server)
            if (mailConfigured) {
                log.info("Attempting to send real email...");
                boolean sent = sendEmail(email, subject, content);
                if (sent) {
                    log.info("OTP sent to email: {}", email);
                    return true;
                } else {
                    log.error("Failed to send email, falling back to simulation");
                    simulateEmail(email, subject, otp);
                    return true;
                }
            } else {
                // Simulate gửi email - hiển thị OTP trong log để test
                simulateEmail(email, subject, otp);
                return true;
            }
            
        } catch (Exception e) {
            log.error("Failed to send OTP to email: {}", email, e);
            return false;
        }
    }

    // Save a pending registration (will send OTP)
    public void savePendingRegistration(com.example.backend.service.PatientService.PatientRegisterRequest req) {
        if (req == null || req.getEmail() == null) return;
        pendingRegistrations.put(req.getEmail(), req);
        // send OTP to email (simulate or real depending on config)
        sendOtp(req.getEmail());
    }

    // Consume (remove and return) pending registration
    public com.example.backend.service.PatientService.PatientRegisterRequest consumePendingRegistration(String email) {
        return pendingRegistrations.remove(email);
    }

    // Check if there is a pending registration for email
    public boolean hasPendingRegistration(String email) {
        return pendingRegistrations.containsKey(email);
    }

    public boolean verifyOtp(String email, String inputOtp) {
        String savedOtp = otpStorage.get(email);
        
        if (savedOtp == null) {
            log.warn("No OTP found for email: {}", email);
            return false;
        }
        
        boolean isValid = savedOtp.equals(inputOtp);
        
        if (isValid) {
            log.info("OTP verified successfully for email: {}", email);
        } else {
            log.warn("Invalid OTP for email: {}", email);
        }
        
        return isValid;
    }

    /**
     * Xóa OTP sau khi sử dụng thành công (cho reset password)
     */
    public void consumeOtp(String email) {
        otpStorage.remove(email);
        log.info("OTP consumed and removed for email: {}", email);
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // 6 digit OTP
        return String.valueOf(otp);
    }

    private void scheduleOtpExpiry(String email, int minutes) {
        scheduler.schedule(() -> {
            otpStorage.remove(email);
            log.info("OTP expired and removed for email: {}", email);
        }, minutes, TimeUnit.MINUTES);
    }

    private String buildOtpEmailContent(String otp) {
        return "Chào bạn,\n\n"
             + "Mã xác thực OTP của bạn là: " + otp + "\n"
             + "Mã này có hiệu lực trong 5 phút.\n\n"
             + "Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.\n\n"
             + "Trân trọng,\n"
             + "Đội ngũ ClinicBooking";
    }

    private boolean isMailServerConfigured() {
        try {
            // Kiểm tra có JavaMailSender và email config
            if (mailSender == null) {
                log.debug("JavaMailSender is null");
                return false;
            }
            
            // Kiểm tra email configuration
            log.debug("Checking mail configuration - Username: {}", fromEmail);
            
            // Enable real email mode nếu có config thật
            boolean configured = fromEmail != null && 
                   !fromEmail.isEmpty() && 
                   fromEmail.contains("@") &&
                   !fromEmail.equals("noreply@clinic.com");
                   
            log.info("Mail configuration check result: {}", configured);
            return configured;
                   
        } catch (Exception e) {
            log.error("Error checking mail server configuration", e);
            return false;
        }
    }

    private boolean sendEmail(String to, String subject, String body) {
        try {
            log.info("Attempting to send real email to: {}", to);
            
            // Sử dụng SimpleMailMessage thay vì MimeMessage để đơn giản hóa
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
            return true;
            
        } catch (MailAuthenticationException e) {
            log.error("Authentication failed when sending email. Check username/password: {}", e.getMessage());
            return false;
        } catch (MailSendException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error when sending email to {}: {}", to, e.getMessage());
            return false;
        }
    }

    private void simulateEmail(String email, String subject, String otp) {
        log.info("=== SIMULATED EMAIL ===");
        log.info("To: {}", email);
        log.info("Subject: {}", subject);
        log.info("OTP: {}", otp);
        log.info("======================");
    }

    // Method để clear OTP manually nếu cần
    public void clearOtp(String email) {
        otpStorage.remove(email);
        log.info("OTP cleared manually for email: {}", email);
    }
}