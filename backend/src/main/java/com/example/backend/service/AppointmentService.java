package com.example.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.AppointmentDTO;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.AppointmentMapper;
import com.example.backend.model.Appointment;
import com.example.backend.model.Doctor;
import com.example.backend.model.DoctorSchedule;
import com.example.backend.model.Patient;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.DoctorScheduleRepository;
import com.example.backend.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final AppointmentMapper appointmentMapper;
    private final EmailService emailService;

    public AppointmentDTO.Response create(AppointmentDTO.Create dto) {
        // Cho phép patient null khi bác sĩ tạo slot trống
        Patient patient = null;
        if (dto.getPatientId() != null) {
            patient = patientRepository.findById(dto.getPatientId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với ID: " + dto.getPatientId()));
        }
        
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bác sĩ với ID: " + dto.getDoctorId()));
        
        // ScheduleID là BẮT BUỘC - Appointment phải thuộc về một DoctorSchedule
        DoctorSchedule schedule = doctorScheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lịch trình với ID: " + dto.getScheduleId()));
        
        // Validate: Schedule phải thuộc về doctor này
        if (!schedule.getDoctor().getDoctorId().equals(dto.getDoctorId())) {
            throw new IllegalStateException("Lịch trình không thuộc về bác sĩ này");
        }
        
        // Validate: Schedule phải Available
        if (!"Available".equals(schedule.getStatus())) {
            throw new IllegalStateException("Lịch trình không khả dụng");
        }
        
        // Validate: Appointment phải nằm TRONG khoảng thời gian của DoctorSchedule
        java.time.LocalDate scheduleDate = schedule.getWorkDate();
        java.time.LocalTime scheduleStartTime = schedule.getStartTime();
        java.time.LocalTime scheduleEndTime = schedule.getEndTime();
        
        java.time.LocalDate appointmentDate = dto.getStartTime().toLocalDate();
        java.time.LocalTime appointmentStartTime = dto.getStartTime().toLocalTime();
        java.time.LocalTime appointmentEndTime = dto.getEndTime().toLocalTime();
        
        // Kiểm tra ngày phải trùng
        if (!appointmentDate.equals(scheduleDate)) {
            throw new IllegalStateException(
                "Ngày khám (" + appointmentDate + ") phải trùng với ngày làm việc (" + scheduleDate + ")"
            );
        }
        
        // Kiểm tra giờ phải nằm trong khoảng
        if (appointmentStartTime.isBefore(scheduleStartTime)) {
            throw new IllegalStateException(
                "Giờ bắt đầu (" + appointmentStartTime + ") phải sau giờ bắt đầu làm việc (" + scheduleStartTime + ")"
            );
        }
        
        if (appointmentEndTime.isAfter(scheduleEndTime)) {
            throw new IllegalStateException(
                "Giờ kết thúc (" + appointmentEndTime + ") phải trước giờ kết thúc làm việc (" + scheduleEndTime + ")"
            );
        }
        
        // =====================================================================
        // Validate: Không cho phép tạo khung giờ trùng lặp
        // Kiểm tra xem đã có appointment nào của bác sĩ này trong khoảng thời gian này chưa
        // =====================================================================
        List<Appointment> existingAppointments = appointmentRepository.findByDoctor_DoctorId(dto.getDoctorId());
        for (Appointment existing : existingAppointments) {
            // Kiểm tra overlap: 
            // Appointment mới overlap nếu startTime < existing.endTime VÀ endTime > existing.startTime
            if (dto.getStartTime().isBefore(existing.getEndTime()) && 
                dto.getEndTime().isAfter(existing.getStartTime())) {
                throw new IllegalStateException(
                    String.format("Khung giờ bị trùng với appointment đã tồn tại (ID: %d) từ %s đến %s",
                        existing.getAppointmentId(),
                        existing.getStartTime(),
                        existing.getEndTime()
                    )
                );
            }
        }

        Appointment entity = appointmentMapper.createDTOToEntity(dto, patient, doctor, schedule);
        Appointment saved = appointmentRepository.save(entity);

        return appointmentMapper.entityToResponseDTO(saved);
    }

    // Helper to send notification emails for appointment events
    private void notifyPatient(Appointment appointment, String subject, String body) {
        if (appointment == null || appointment.getPatient() == null || appointment.getPatient().getUser() == null) return;
        String email = appointment.getPatient().getUser().getEmail();
        emailService.sendSimpleEmail(email, subject, body);
    }

    @Transactional(readOnly = true)
    public AppointmentDTO.Response getById(Long appointmentId) {
        Appointment entity = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + appointmentId));
        return appointmentMapper.entityToResponseDTO(entity);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> getByPatient(Long patientId) {
        List<Appointment> list = appointmentRepository.findByPatient_PatientId(patientId);
        return list.stream().map(appointmentMapper::entityToResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> getByDoctor(Long doctorId) {
        List<Appointment> list = appointmentRepository.findByDoctor_DoctorId(doctorId);
        return list.stream().map(appointmentMapper::entityToResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> getAvailableSlotsByDoctor(Long doctorId) {
        List<Appointment> list = appointmentRepository.findByDoctor_DoctorId(doctorId);
        // Lọc các appointment có patient = null và status = "Available"
        return list.stream()
                .filter(apt -> apt.getPatient() == null && "Available".equals(apt.getStatus()))
                .map(appointmentMapper::entityToResponseDTO)
                .toList();
    }

    public AppointmentDTO.Response bookAppointment(Long appointmentId, Long patientId, String notes) {
        Appointment entity = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + appointmentId));
        
        // Kiểm tra appointment còn available không
        if (entity.getPatient() != null) {
            throw new IllegalStateException("Khung giờ này đã được đặt");
        }
        if (!"Available".equals(entity.getStatus())) {
            throw new IllegalStateException("Khung giờ này không còn khả dụng");
        }
        
        // Tìm patient
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với ID: " + patientId));
        
        // Cập nhật appointment
        entity.setPatient(patient);
        entity.setStatus("Scheduled");
        if (notes != null && !notes.trim().isEmpty()) {
            entity.setNotes(notes);
        }
        
        Appointment saved = appointmentRepository.save(entity);
        
        // Gửi email thông báo
        try {
            String subject = "Đặt lịch khám thành công";
            String body = "Bạn đã đặt lịch khám thành công vào " + saved.getStartTime() + 
                         " với bác sĩ " + saved.getDoctor().getUser().getFirstName() + " " + 
                         saved.getDoctor().getUser().getLastName();
            notifyPatient(saved, subject, body);
        } catch (Exception ex) {
            // ignore email failures
        }
        
        return appointmentMapper.entityToResponseDTO(saved);
    }

    public AppointmentDTO.Response update(Long appointmentId, AppointmentDTO.Update dto) {
        Appointment entity = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + appointmentId));
        appointmentMapper.applyUpdateToEntity(entity, dto);
        Appointment saved = appointmentRepository.save(entity);
        try {
            String subject = "Lịch khám đã được cập nhật";
            String body = "Lịch khám của bạn đã được cập nhật. Vui lòng kiểm tra chi tiết trong ứng dụng.";
            notifyPatient(saved, subject, body);
        } catch (Exception ex) {
            // swallow - email failures shouldn't prevent update
        }
        return appointmentMapper.entityToResponseDTO(saved);
    }

    public void delete(Long appointmentId) {
        if (!appointmentRepository.existsById(appointmentId)) {
            throw new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + appointmentId);
        }
        appointmentRepository.deleteById(appointmentId);
    }

    public AppointmentDTO.Response cancelAppointment(Long appointmentId) {
        Appointment entity = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + appointmentId));
        
        // Cập nhật status thành "từ chối lịch hẹn"
        entity.setStatus("Từ chối lịch hẹn");
        
        // Nếu có schedule, giải phóng slot
        if (entity.getSchedule() != null) {
            entity.getSchedule().setStatus("Available");
            doctorScheduleRepository.save(entity.getSchedule());
        }
        
        Appointment saved = appointmentRepository.save(entity);
        try {
            String subject = "Lịch khám đã bị hủy";
            String body = "Lịch khám của bạn đã bị hủy. Vui lòng liên hệ nếu cần đặt lại.";
            notifyPatient(saved, subject, body);
        } catch (Exception ex) {
            // ignore
        }
        return appointmentMapper.entityToResponseDTO(saved);
    }
    
}


