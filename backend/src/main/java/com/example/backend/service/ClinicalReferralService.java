package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.CreateReferralRequest;
import com.example.backend.dto.SystemNotificationDTO;
import com.example.backend.dto.UpdateResultRequest;
import com.example.backend.exception.NotFoundException;
import com.example.backend.model.Appointment;
import com.example.backend.model.ClinicalReferral;
import com.example.backend.model.ClinicalReferralStatus;
import com.example.backend.model.Department;
import com.example.backend.model.Doctor;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.ClinicalReferralRepository;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.repository.DoctorRepository;

import lombok.RequiredArgsConstructor;

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
        System.out.println("🔍 ClinicalReferralService.createReferral called");
        System.out.println("🔍 Request: " + request);
        System.out.println("🔍 AppointmentId: " + request.getAppointmentId());
        System.out.println("🔍 ToDepartmentId: " + request.getToDepartmentId());
        System.out.println("🔍 Notes: " + request.getNotes());

        Appointment appointment = appointmentRepo.findById(request.getAppointmentId())
                .orElseThrow(() -> {
                    System.err.println("❌ Appointment not found with ID: " + request.getAppointmentId());
                    return new NotFoundException("Appointment not found with ID: " + request.getAppointmentId());
                });

        System.out.println("✅ Found appointment: " + appointment.getAppointmentId());

        Department department = departmentRepo.findById(request.getToDepartmentId())
                .orElseThrow(() -> {
                    System.err.println("❌ Department not found with ID: " + request.getToDepartmentId());
                    return new NotFoundException("Department not found with ID: " + request.getToDepartmentId());
                });

        System.out.println("✅ Found department: " + department.getDepartmentName());

        // Validate that appointment has a doctor
        if (appointment.getDoctor() == null) {
            System.err.println("❌ Appointment does not have a doctor assigned");
            throw new IllegalStateException("Appointment does not have an assigned doctor. Cannot create referral.");
        }

        System.out.println("✅ Appointment has doctor: " + appointment.getDoctor().getDoctorId());

        ClinicalReferral referral = new ClinicalReferral();
        referral.setAppointment(appointment);
        referral.setFromDoctor(appointment.getDoctor());
        referral.setToDepartment(department);
        referral.setNotes(request.getNotes());
        referral.setStatus(ClinicalReferralStatus.PENDING);
        referral.setCreatedAt(LocalDateTime.now());

        System.out.println("💾 Saving referral...");
        ClinicalReferral saved = referralRepo.save(referral);
        System.out.println("✅ Referral saved with ID: " + saved.getReferralId());

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
        System.out.println("🔍 ClinicalReferralService.updateResult called");
        System.out.println("🔍 ReferralId: " + referralId);
        System.out.println("🔍 PerformedByDoctorId from request: " + request.getPerformedByDoctorId());
        
        ClinicalReferral referral = referralRepo.findById(referralId)
                .orElseThrow(() -> new NotFoundException("Referral not found"));

        System.out.println("✅ Found referral with toDepartmentId: " + referral.getToDepartment().getId());

        // Validate and set performedByDoctor
        if (request.getPerformedByDoctorId() != null) {
            Doctor performer = doctorRepo.findById(request.getPerformedByDoctorId())
                    .orElseThrow(() -> new NotFoundException("Doctor not found with ID: " + request.getPerformedByDoctorId()));
            
            System.out.println("✅ Found doctor with ID: " + performer.getDoctorId());
            
            // Check if doctor's department matches referral's toDepartment
            if (performer.getDepartment() == null) {
                System.err.println("❌ Doctor does not have a department assigned");
                throw new IllegalStateException("Bác sĩ chưa được phân công vào khoa. Không thể cập nhật kết quả.");
            }
            
            Long doctorDepartmentId = performer.getDepartment().getId();
            Long referralToDepartmentId = referral.getToDepartment().getId();
            
            System.out.println("🔍 Doctor's departmentId: " + doctorDepartmentId);
            System.out.println("🔍 Referral's toDepartmentId: " + referralToDepartmentId);
            
            if (!doctorDepartmentId.equals(referralToDepartmentId)) {
                System.err.println("❌ Department mismatch!");
                throw new IllegalStateException(
                    String.format("Bác sĩ không thuộc khoa được chỉ định. Khoa của bác sĩ: %s, Khoa được chỉ định: %s",
                        performer.getDepartment().getDepartmentName(),
                        referral.getToDepartment().getDepartmentName())
                );
            }
            
            System.out.println("✅ Department match! Setting performedByDoctor");
            referral.setPerformedByDoctor(performer);
        } else {
            System.err.println("❌ PerformedByDoctorId is null in request");
            throw new IllegalArgumentException("Thiếu thông tin bác sĩ thực hiện");
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
