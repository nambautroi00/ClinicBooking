package com.example.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ClinicalReferrals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalReferral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ReferralID")
    private Long referralId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AppointmentID", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "FromDoctorID", nullable = false)
    private Doctor fromDoctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ToDepartmentID", nullable = false)
    private Department toDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PerformedByDoctorID")
    private Doctor performedByDoctor;

    @Column(name = "Notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @Column(name = "ResultText", columnDefinition = "NVARCHAR(MAX)")
    private String resultText;

    @Column(name = "ResultFileUrl", length = 500)
    private String resultFileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private ClinicalReferralStatus status = ClinicalReferralStatus.PENDING;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "CompletedAt")
    private LocalDateTime completedAt;

    // Getters and Setters
    public Long getReferralId() {
        return referralId;
    }

    public void setReferralId(Long referralId) {
        this.referralId = referralId;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public void setAppointment(Appointment appointment) {
        this.appointment = appointment;
    }

    public Doctor getFromDoctor() {
        return fromDoctor;
    }

    public void setFromDoctor(Doctor fromDoctor) {
        this.fromDoctor = fromDoctor;
    }

    public Department getToDepartment() {
        return toDepartment;
    }

    public void setToDepartment(Department toDepartment) {
        this.toDepartment = toDepartment;
    }

    public Doctor getPerformedByDoctor() {
        return performedByDoctor;
    }

    public void setPerformedByDoctor(Doctor performedByDoctor) {
        this.performedByDoctor = performedByDoctor;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getResultText() {
        return resultText;
    }

    public void setResultText(String resultText) {
        this.resultText = resultText;
    }

    public String getResultFileUrl() {
        return resultFileUrl;
    }

    public void setResultFileUrl(String resultFileUrl) {
        this.resultFileUrl = resultFileUrl;
    }

    public ClinicalReferralStatus getStatus() {
        return status;
    }

    public void setStatus(ClinicalReferralStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
