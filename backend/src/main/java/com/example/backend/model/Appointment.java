package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appointmentID;

    @ManyToOne
    @JoinColumn(name = "patientID", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctorID", nullable = false)
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "scheduleID")
    private DoctorSchedule schedule;

    private LocalDateTime appointmentTime;

    @Column(length = 30)
    private String status;

    @Column(length = 255)
    private String notes;

    public Appointment() {
    }

    public Appointment(Long appointmentID, Patient patient, Doctor doctor, DoctorSchedule schedule,
                       LocalDateTime appointmentTime, String status, String notes) {
        this.appointmentID = appointmentID;
        this.patient = patient;
        this.doctor = doctor;
        this.schedule = schedule;
        this.appointmentTime = appointmentTime;
        this.status = status;
        this.notes = notes;
    }

    public Long getAppointmentID() {
        return appointmentID;
    }

    public void setAppointmentID(Long appointmentID) {
        this.appointmentID = appointmentID;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public DoctorSchedule getSchedule() {
        return schedule;
    }

    public void setSchedule(DoctorSchedule schedule) {
        this.schedule = schedule;
    }

    public LocalDateTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalDateTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}
