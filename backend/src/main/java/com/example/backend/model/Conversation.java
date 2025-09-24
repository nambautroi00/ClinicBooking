package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Conversations")
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long conversationID;

    @ManyToOne
    @JoinColumn(name = "patientID", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctorID", nullable = false)
    private Doctor doctor;

    private LocalDateTime createdAt;

    public Long getConversationID() {
        return conversationID;
    }

    public void setConversationID(Long conversationID) {
        this.conversationID = conversationID;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Conversation() {
    }

    public Conversation(Long conversationID, Patient patient, Doctor doctor, LocalDateTime createdAt) {
        this.conversationID = conversationID;
        this.patient = patient;
        this.doctor = doctor;
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Conversation{" +
                "conversationID=" + conversationID +
                ", patient=" + patient +
                ", doctor=" + doctor +
                ", createdAt=" + createdAt +
                '}';
    }
}
