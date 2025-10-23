package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.backend.dto.AppointmentDTO;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.AppointmentMapper;
import com.example.backend.model.Appointment;
import com.example.backend.model.Doctor;
import com.example.backend.model.DoctorSchedule;
import com.example.backend.model.Patient;
import com.example.backend.model.User;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.DoctorScheduleRepository;
import com.example.backend.repository.PatientRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentService Unit Tests")
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    
    @Mock
    private PatientRepository patientRepository;
    
    @Mock
    private DoctorRepository doctorRepository;
    
    @Mock
    private DoctorScheduleRepository doctorScheduleRepository;
    
    @Mock
    private AppointmentMapper appointmentMapper;
    
    @Mock
    private EmailService emailService;

    @InjectMocks
    private AppointmentService appointmentService;

    private AppointmentDTO.Create validCreateDTO;
    private Patient validPatient;
    private Doctor validDoctor;
    private DoctorSchedule validSchedule;
    private Appointment validAppointment;
    private AppointmentDTO.Response validResponseDTO;

    @BeforeEach
    void setUp() {
        // Setup test data
        setupTestData();
    }

    private void setupTestData() {
        // Create valid Create DTO
        validCreateDTO = new AppointmentDTO.Create();
        validCreateDTO.setPatientId(1L);
        validCreateDTO.setDoctorId(1L);
        validCreateDTO.setScheduleId(1L);
        validCreateDTO.setStartTime(LocalDateTime.of(2024, 1, 15, 9, 0));
        validCreateDTO.setEndTime(LocalDateTime.of(2024, 1, 15, 9, 30));
        validCreateDTO.setStatus("Available");
        validCreateDTO.setNotes("Test appointment");

        // Create valid Patient
        User patientUser = new User();
        patientUser.setUserId(1L);
        patientUser.setEmail("patient@test.com");
        patientUser.setFirstName("John");
        patientUser.setLastName("Doe");

        validPatient = new Patient();
        validPatient.setPatientId(1L);
        validPatient.setUser(patientUser);

        // Create valid Doctor
        User doctorUser = new User();
        doctorUser.setUserId(2L);
        doctorUser.setEmail("doctor@test.com");
        doctorUser.setFirstName("Dr. Jane");
        doctorUser.setLastName("Smith");

        validDoctor = new Doctor();
        validDoctor.setDoctorId(1L);
        validDoctor.setUser(doctorUser);

        // Create valid Schedule
        validSchedule = new DoctorSchedule();
        validSchedule.setScheduleId(1L);
        validSchedule.setDoctor(validDoctor);
        validSchedule.setWorkDate(LocalDate.of(2024, 1, 15));
        validSchedule.setStartTime(LocalTime.of(8, 0));
        validSchedule.setEndTime(LocalTime.of(17, 0));
        validSchedule.setStatus("Available");

        // Create valid Appointment entity
        validAppointment = new Appointment();
        validAppointment.setAppointmentId(1L);
        validAppointment.setPatient(validPatient);
        validAppointment.setDoctor(validDoctor);
        validAppointment.setSchedule(validSchedule);
        validAppointment.setStartTime(validCreateDTO.getStartTime());
        validAppointment.setEndTime(validCreateDTO.getEndTime());
        validAppointment.setStatus("Available");
        validAppointment.setNotes("Test appointment");

        // Create valid Response DTO
        validResponseDTO = new AppointmentDTO.Response();
        validResponseDTO.setAppointmentId(1L);
        validResponseDTO.setPatientId(1L);
        validResponseDTO.setDoctorId(1L);
        validResponseDTO.setScheduleId(1L);
        validResponseDTO.setStartTime(validCreateDTO.getStartTime());
        validResponseDTO.setEndTime(validCreateDTO.getEndTime());
        validResponseDTO.setStatus("Available");
        validResponseDTO.setNotes("Test appointment");
    }

    @Test
    @DisplayName("Should create valid appointment successfully")
    void testCreateValidAppointment() {
        // Given
        when(patientRepository.findById(1L)).thenReturn(Optional.of(validPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(validDoctor));
        when(doctorScheduleRepository.findById(1L)).thenReturn(Optional.of(validSchedule));
        when(appointmentRepository.findByDoctor_DoctorId(1L)).thenReturn(new ArrayList<>());
        when(appointmentMapper.createDTOToEntity(any(), any(), any(), any())).thenReturn(validAppointment);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(validAppointment);
        when(appointmentMapper.entityToResponseDTO(validAppointment)).thenReturn(validResponseDTO);

        // When
        AppointmentDTO.Response result = appointmentService.create(validCreateDTO);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getAppointmentId());
        assertEquals(1L, result.getPatientId());
        assertEquals(1L, result.getDoctorId());
        assertEquals("Available", result.getStatus());

        verify(patientRepository).findById(1L);
        verify(doctorRepository).findById(1L);
        verify(doctorScheduleRepository).findById(1L);
        verify(appointmentRepository).findByDoctor_DoctorId(1L);
        verify(appointmentRepository).save(validAppointment);
        verify(appointmentMapper).entityToResponseDTO(validAppointment);
    }

    @Test
    @DisplayName("Should create appointment with null patient (doctor creates slot)")
    void testCreateAppointmentWithNullPatient() {
        // Given
        AppointmentDTO.Create dtoWithNullPatient = new AppointmentDTO.Create();
        dtoWithNullPatient.setPatientId(null); // null patient
        dtoWithNullPatient.setDoctorId(1L);
        dtoWithNullPatient.setScheduleId(1L);
        dtoWithNullPatient.setStartTime(LocalDateTime.of(2024, 1, 15, 9, 0));
        dtoWithNullPatient.setEndTime(LocalDateTime.of(2024, 1, 15, 9, 30));
        dtoWithNullPatient.setStatus("Available");

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(validDoctor));
        when(doctorScheduleRepository.findById(1L)).thenReturn(Optional.of(validSchedule));
        when(appointmentRepository.findByDoctor_DoctorId(1L)).thenReturn(new ArrayList<>());
        when(appointmentMapper.createDTOToEntity(any(), isNull(), any(), any())).thenReturn(validAppointment);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(validAppointment);
        when(appointmentMapper.entityToResponseDTO(validAppointment)).thenReturn(validResponseDTO);

        // When
        AppointmentDTO.Response result = appointmentService.create(dtoWithNullPatient);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getAppointmentId());
        assertEquals(1L, result.getDoctorId());
        assertEquals("Available", result.getStatus());

        verify(patientRepository, never()).findById(any());
        verify(doctorRepository).findById(1L);
        verify(doctorScheduleRepository).findById(1L);
        verify(appointmentRepository).save(validAppointment);
    }

    @Test
    @DisplayName("Should throw NotFoundException for invalid doctor ID")
    void testCreateWithInvalidDoctorId() {
        // Given
        when(patientRepository.findById(1L)).thenReturn(Optional.of(validPatient));
        when(doctorRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class, 
            () -> appointmentService.create(validCreateDTO));
        
        assertEquals("Không tìm thấy bác sĩ với ID: 999", exception.getMessage());
        
        verify(patientRepository).findById(1L);
        verify(doctorRepository).findById(999L);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw NotFoundException for invalid schedule ID")
    void testCreateWithInvalidScheduleId() {
        // Given
        when(patientRepository.findById(1L)).thenReturn(Optional.of(validPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(validDoctor));
        when(doctorScheduleRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        NotFoundException exception = assertThrows(NotFoundException.class, 
            () -> appointmentService.create(validCreateDTO));
        
        assertEquals("Không tìm thấy lịch trình với ID: 999", exception.getMessage());
        
        verify(patientRepository).findById(1L);
        verify(doctorRepository).findById(1L);
        verify(doctorScheduleRepository).findById(999L);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw IllegalStateException for unavailable schedule")
    void testCreateWithUnavailableSchedule() {
        // Given
        DoctorSchedule unavailableSchedule = new DoctorSchedule();
        unavailableSchedule.setScheduleId(1L);
        unavailableSchedule.setDoctor(validDoctor);
        unavailableSchedule.setWorkDate(LocalDate.of(2024, 1, 15));
        unavailableSchedule.setStartTime(LocalTime.of(8, 0));
        unavailableSchedule.setEndTime(LocalTime.of(17, 0));
        unavailableSchedule.setStatus("Booked"); // Not available

        when(patientRepository.findById(1L)).thenReturn(Optional.of(validPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(validDoctor));
        when(doctorScheduleRepository.findById(1L)).thenReturn(Optional.of(unavailableSchedule));

        // When & Then
        IllegalStateException exception = assertThrows(IllegalStateException.class, 
            () -> appointmentService.create(validCreateDTO));
        
        assertEquals("Lịch trình không khả dụng", exception.getMessage());
        
        verify(patientRepository).findById(1L);
        verify(doctorRepository).findById(1L);
        verify(doctorScheduleRepository).findById(1L);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw IllegalStateException for wrong doctor-schedule relationship")
    void testCreateWithWrongDoctorScheduleRelationship() {
        // Given
        Doctor differentDoctor = new Doctor();
        differentDoctor.setDoctorId(2L);
        differentDoctor.setUser(validDoctor.getUser());

        DoctorSchedule scheduleWithDifferentDoctor = new DoctorSchedule();
        scheduleWithDifferentDoctor.setScheduleId(1L);
        scheduleWithDifferentDoctor.setDoctor(differentDoctor); // Different doctor
        scheduleWithDifferentDoctor.setWorkDate(LocalDate.of(2024, 1, 15));
        scheduleWithDifferentDoctor.setStartTime(LocalTime.of(8, 0));
        scheduleWithDifferentDoctor.setEndTime(LocalTime.of(17, 0));
        scheduleWithDifferentDoctor.setStatus("Available");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(validPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(validDoctor));
        when(doctorScheduleRepository.findById(1L)).thenReturn(Optional.of(scheduleWithDifferentDoctor));

        // When & Then
        IllegalStateException exception = assertThrows(IllegalStateException.class, 
            () -> appointmentService.create(validCreateDTO));
        
        assertEquals("Lịch trình không thuộc về bác sĩ này", exception.getMessage());
        
        verify(patientRepository).findById(1L);
        verify(doctorRepository).findById(1L);
        verify(doctorScheduleRepository).findById(1L);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw IllegalStateException for appointment time outside schedule")
    void testCreateWithTimeOutsideSchedule() {
        // Given
        AppointmentDTO.Create dtoWithInvalidTime = new AppointmentDTO.Create();
        dtoWithInvalidTime.setPatientId(1L);
        dtoWithInvalidTime.setDoctorId(1L);
        dtoWithInvalidTime.setScheduleId(1L);
        dtoWithInvalidTime.setStartTime(LocalDateTime.of(2024, 1, 15, 7, 0)); // Before schedule start
        dtoWithInvalidTime.setEndTime(LocalDateTime.of(2024, 1, 15, 7, 30));
        dtoWithInvalidTime.setStatus("Available");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(validPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(validDoctor));
        when(doctorScheduleRepository.findById(1L)).thenReturn(Optional.of(validSchedule));

        // When & Then
        IllegalStateException exception = assertThrows(IllegalStateException.class, 
            () -> appointmentService.create(dtoWithInvalidTime));
        
        assertTrue(exception.getMessage().contains("Giờ bắt đầu"));
        assertTrue(exception.getMessage().contains("phải sau giờ bắt đầu làm việc"));
        
        verify(patientRepository).findById(1L);
        verify(doctorRepository).findById(1L);
        verify(doctorScheduleRepository).findById(1L);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw IllegalStateException for time overlap with existing appointment")
    void testCreateWithTimeOverlap() {
        // Given
        Appointment existingAppointment = new Appointment();
        existingAppointment.setAppointmentId(2L);
        existingAppointment.setStartTime(LocalDateTime.of(2024, 1, 15, 9, 0));
        existingAppointment.setEndTime(LocalDateTime.of(2024, 1, 15, 9, 30));

        List<Appointment> existingAppointments = new ArrayList<>();
        existingAppointments.add(existingAppointment);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(validPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(validDoctor));
        when(doctorScheduleRepository.findById(1L)).thenReturn(Optional.of(validSchedule));
        when(appointmentRepository.findByDoctor_DoctorId(1L)).thenReturn(existingAppointments);

        // When & Then
        IllegalStateException exception = assertThrows(IllegalStateException.class, 
            () -> appointmentService.create(validCreateDTO));
        
        assertTrue(exception.getMessage().contains("Khung giờ bị trùng"));
        assertTrue(exception.getMessage().contains("ID: 2"));
        
        verify(patientRepository).findById(1L);
        verify(doctorRepository).findById(1L);
        verify(doctorScheduleRepository).findById(1L);
        verify(appointmentRepository).findByDoctor_DoctorId(1L);
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should book appointment successfully")
    void testBookAppointmentSuccess() {
        // Given
        Long appointmentId = 1L;
        Long patientId = 1L;
        String notes = "Test booking notes";

        Appointment availableAppointment = new Appointment();
        availableAppointment.setAppointmentId(appointmentId);
        availableAppointment.setPatient(null); // Available slot
        availableAppointment.setStatus("Available");
        availableAppointment.setDoctor(validDoctor);
        availableAppointment.setSchedule(validSchedule);

        Appointment bookedAppointment = new Appointment();
        bookedAppointment.setAppointmentId(appointmentId);
        bookedAppointment.setPatient(validPatient);
        bookedAppointment.setStatus("Scheduled");
        bookedAppointment.setNotes(notes);
        bookedAppointment.setDoctor(validDoctor);
        bookedAppointment.setSchedule(validSchedule);

        AppointmentDTO.Response responseDTO = new AppointmentDTO.Response();
        responseDTO.setAppointmentId(appointmentId);
        responseDTO.setPatientId(patientId);
        responseDTO.setStatus("Scheduled");
        responseDTO.setNotes(notes);

        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(availableAppointment));
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(validPatient));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(bookedAppointment);
        when(appointmentMapper.entityToResponseDTO(bookedAppointment)).thenReturn(responseDTO);

        // When
        AppointmentDTO.Response result = appointmentService.bookAppointment(appointmentId, patientId, notes);

        // Then
        assertNotNull(result);
        assertEquals(appointmentId, result.getAppointmentId());
        assertEquals(patientId, result.getPatientId());
        assertEquals("Scheduled", result.getStatus());
        assertEquals(notes, result.getNotes());

        verify(appointmentRepository).findById(appointmentId);
        verify(patientRepository).findById(patientId);
        verify(appointmentRepository).save(any(Appointment.class));
        verify(emailService).sendSimpleEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should throw IllegalStateException when booking already booked appointment")
    void testBookAlreadyBookedAppointment() {
        // Given
        Long appointmentId = 1L;
        Long patientId = 1L;

        Appointment bookedAppointment = new Appointment();
        bookedAppointment.setAppointmentId(appointmentId);
        bookedAppointment.setPatient(validPatient); // Already booked
        bookedAppointment.setStatus("Scheduled");

        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(bookedAppointment));

        // When & Then
        IllegalStateException exception = assertThrows(IllegalStateException.class, 
            () -> appointmentService.bookAppointment(appointmentId, patientId, "notes"));
        
        assertEquals("Khung giờ này đã được đặt", exception.getMessage());
        
        verify(appointmentRepository).findById(appointmentId);
        verify(patientRepository, never()).findById(any());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should cancel appointment successfully")
    void testCancelAppointmentSuccess() {
        // Given
        Long appointmentId = 1L;

        Appointment appointmentToCancel = new Appointment();
        appointmentToCancel.setAppointmentId(appointmentId);
        appointmentToCancel.setPatient(validPatient);
        appointmentToCancel.setStatus("Scheduled");
        appointmentToCancel.setSchedule(validSchedule);

        Appointment cancelledAppointment = new Appointment();
        cancelledAppointment.setAppointmentId(appointmentId);
        cancelledAppointment.setPatient(validPatient);
        cancelledAppointment.setStatus("Từ chối lịch hẹn");
        cancelledAppointment.setSchedule(validSchedule);

        AppointmentDTO.Response responseDTO = new AppointmentDTO.Response();
        responseDTO.setAppointmentId(appointmentId);
        responseDTO.setStatus("Từ chối lịch hẹn");

        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appointmentToCancel));
        when(doctorScheduleRepository.save(any(DoctorSchedule.class))).thenReturn(validSchedule);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(cancelledAppointment);
        when(appointmentMapper.entityToResponseDTO(cancelledAppointment)).thenReturn(responseDTO);

        // When
        AppointmentDTO.Response result = appointmentService.cancelAppointment(appointmentId);

        // Then
        assertNotNull(result);
        assertEquals(appointmentId, result.getAppointmentId());
        assertEquals("Từ chối lịch hẹn", result.getStatus());

        verify(appointmentRepository).findById(appointmentId);
        verify(doctorScheduleRepository).save(validSchedule);
        verify(appointmentRepository).save(any(Appointment.class));
        verify(emailService).sendSimpleEmail(anyString(), anyString(), anyString());
    }
}
