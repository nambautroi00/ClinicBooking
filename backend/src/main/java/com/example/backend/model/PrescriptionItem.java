package com.example.backend.model;

import jakarta.persistence.*;


@Entity
@Table(name = "PrescriptionItems")

public class PrescriptionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemID;

    @ManyToOne
    @JoinColumn(name = "prescriptionID", nullable = false)
    private Prescription prescription;

    @ManyToOne
    @JoinColumn(name = "medicineID", nullable = false)
    private Medicine medicine;

    @Column(length = 50)
    private String dosage;

    @Column(length = 50)
    private String duration;

    @Column(length = 255)
    private String note;

    public PrescriptionItem() {
    }

    public PrescriptionItem(Long itemID, Prescription prescription, Medicine medicine, String dosage, String duration, String note) {
        this.itemID = itemID;
        this.prescription = prescription;
        this.medicine = medicine;
        this.dosage = dosage;
        this.duration = duration;
        this.note = note;
    }

    public Long getItemID() {
        return itemID;
    }

    public void setItemID(Long itemID) {
        this.itemID = itemID;
    }

    public Prescription getPrescription() {
        return prescription;
    }

    public void setPrescription(Prescription prescription) {
        this.prescription = prescription;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
