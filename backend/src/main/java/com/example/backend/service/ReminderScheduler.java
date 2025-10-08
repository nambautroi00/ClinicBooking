package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.model.Appointment;
import com.example.backend.repository.AppointmentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {
    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    // every 5 minutes check for appointments in next 30 minutes
    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void sendUpcomingReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime until = now.plusMinutes(30);
        List<Appointment> list = appointmentRepository.findAll().stream()
                .filter(a -> a.getStartTime() != null && a.getStartTime().isAfter(now)
                        && a.getStartTime().isBefore(until) && !"ReminderSent".equals(a.getStatus()))
                .toList();
        for (Appointment a : list) {
            try {
                String patientEmail = a.getPatient() != null && a.getPatient().getUser() != null
                        ? a.getPatient().getUser().getEmail()
                        : null;
                String subject = "Nhắc lịch khám sắp tới";
                String text = String.format("Xin chào %s %s,\n\nBạn có lịch khám với bác sĩ %s vào %s. Vui lòng có mặt đúng giờ.",
                        a.getPatient() != null && a.getPatient().getUser() != null ? a.getPatient().getUser().getFirstName() : "",
                        a.getPatient() != null && a.getPatient().getUser() != null ? a.getPatient().getUser().getLastName() : "",
                        a.getDoctor() != null && a.getDoctor().getUser() != null ? a.getDoctor().getUser().getFirstName() + " " + a.getDoctor().getUser().getLastName() : "",
                        a.getStartTime() != null ? a.getStartTime().toString() : "");
                emailService.sendSimpleEmail(patientEmail, subject, text);
                // mark that reminder was sent by appending status (non-destructive)
                a.setStatus("ReminderSent");
                appointmentRepository.save(a);
                log.debug("Reminder sent for appointment {}", a.getAppointmentId());
            } catch (Exception ex) {
                log.error("Failed sending reminder for appointment {}: {}", a.getAppointmentId(), ex.getMessage());
            }
        }
    }
}
