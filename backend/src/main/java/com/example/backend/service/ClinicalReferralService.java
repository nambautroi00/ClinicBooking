package com.example.backend.service;

import com.example.backend.dto.CreateReferralRequest;
import com.example.backend.dto.UpdateResultRequest;
import com.example.backend.dto.SystemNotificationDTO;
import com.example.backend.exception.NotFoundException;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClinicalReferralService {

    private final ClinicalReferralRepository referralRepo;
    private final AppointmentRepository appointmentRepo;
    private final DoctorRepository doctorRepo;
    private final DepartmentRepository departmentRepo;
    private final SystemNotificationService notificationService;

    @Transactional
    public ClinicalReferral createReferral(CreateReferralRequest request) {
        Appointment appointment = appointmentRepo.findById(request.getAppointmentId())
                .orElseThrow(() -> new NotFoundException("Appointment not found"));

        Department department = departmentRepo.findById(request.getToDepartmentId())
                .orElseThrow(() -> new NotFoundException("Department not found"));

        // Validate that appointment has a doctor
        if (appointment.getDoctor() == null) {
            throw new IllegalStateException("Appointment does not have an assigned doctor. Cannot create referral.");
        }

        ClinicalReferral referral = new ClinicalReferral();
        referral.setAppointment(appointment);
        referral.setFromDoctor(appointment.getDoctor());
        referral.setToDepartment(department);
        referral.setNotes(request.getNotes());
        referral.setStatus(ClinicalReferralStatus.PENDING);
        referral.setCreatedAt(LocalDateTime.now());

        // Cập nhật trạng thái appointment
        appointment.setStatus("REFERRED");
        appointmentRepo.save(appointment);

        ClinicalReferral saved = referralRepo.save(referral);

        // Gửi thông báo
        try {
            Doctor doctor = appointment.getDoctor();
            if (doctor != null && doctor.getUser() != null) {
                SystemNotificationDTO.Create notifDto = new SystemNotificationDTO.Create();
                notifDto.setTitle("Chỉ định cận lâm sàng mới");
                notifDto.setMessage("Bác sĩ " + doctor.getUser().getLastName() + " " + 
                    doctor.getUser().getFirstName() + 
                    " đã chỉ định bạn đến " + department.getDepartmentName());
                notifDto.setAppointmentId(appointment.getAppointmentId());
                notificationService.createNotification(notifDto);
            }
        } catch (Exception e) {
            // Log error but don't fail the transaction
            System.err.println("Failed to send notification: " + e.getMessage());
            e.printStackTrace();
        }

        return saved;
    }

    @Transactional
    public ClinicalReferral updateStatus(Long referralId, ClinicalReferralStatus status) {
        ClinicalReferral referral = referralRepo.findById(referralId)
                .orElseThrow(() -> new NotFoundException("Referral not found"));
        
        referral.setStatus(status);
        
        if (status == ClinicalReferralStatus.DONE) {
            referral.setCompletedAt(LocalDateTime.now());
        }
        
        return referralRepo.save(referral);
    }

    @Transactional
    public ClinicalReferral updateResult(Long referralId, UpdateResultRequest request) {
        ClinicalReferral referral = referralRepo.findById(referralId)
                .orElseThrow(() -> new NotFoundException("Referral not found"));

        if (request.getPerformedByDoctorId() != null) {
            Doctor performer = doctorRepo.findById(request.getPerformedByDoctorId())
                    .orElseThrow(() -> new NotFoundException("Doctor not found"));
            referral.setPerformedByDoctor(performer);
        }

        referral.setResultText(request.getResultText());
        referral.setResultFileUrl(request.getResultFileUrl());
        referral.setStatus(ClinicalReferralStatus.DONE);
        referral.setCompletedAt(LocalDateTime.now());

        ClinicalReferral saved = referralRepo.save(referral);

        // Cập nhật lại appointment status
        Appointment appointment = saved.getAppointment();
        if ("REFERRED".equals(appointment.getStatus())) {
            appointment.setStatus("Confirmed");
            appointmentRepo.save(appointment);
        }

        // Gửi thông báo cho bác sĩ yêu cầu
        try {
            SystemNotificationDTO.Create notifDto = new SystemNotificationDTO.Create();
            notifDto.setTitle("Kết quả cận lâm sàng đã có");
            notifDto.setMessage("Kết quả " + referral.getToDepartment().getDepartmentName() + 
                " của bệnh nhân " + referral.getAppointment().getPatient().getUser().getLastName() +
                " " + referral.getAppointment().getPatient().getUser().getFirstName() + " đã hoàn thành");
            notifDto.setAppointmentId(referral.getAppointment().getAppointmentId());
            notificationService.createNotification(notifDto);
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }

        return saved;
    }

    public List<ClinicalReferral> getByDepartment(Long departmentId) {
        return referralRepo.findByToDepartment_IdOrderByCreatedAtDesc(departmentId);
    }

    public List<ClinicalReferral> getPendingByDepartment(Long departmentId) {
        return referralRepo.findByToDepartment_IdAndStatusOrderByCreatedAtDesc(
            departmentId, 
            ClinicalReferralStatus.PENDING
        );
    }

    public List<ClinicalReferral> getByAppointment(Long appointmentId) {
        return referralRepo.findByAppointment_AppointmentIdOrderByCreatedAtDesc(appointmentId);
    }

    public List<ClinicalReferral> getByDoctor(Long doctorId) {
        return referralRepo.findByFromDoctor_DoctorIdOrderByCreatedAtDesc(doctorId);
    }

    public List<ClinicalReferral> getByPatient(Long patientId) {
        return referralRepo.findByPatientId(patientId);
    }

    public ClinicalReferral getById(Long id) {
        return referralRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Referral not found"));
    }

    public Long countPendingByDoctor(Long doctorId) {
        return referralRepo.countPendingByDoctorId(doctorId);
    }

    public Long countCompletedTodayByDoctor(Long doctorId) {
        return referralRepo.countCompletedTodayByDoctorId(doctorId);
    }

    @Transactional
    public void deleteReferral(Long referralId) {
        ClinicalReferral referral = getById(referralId);
        referralRepo.delete(referral);
    }
}
