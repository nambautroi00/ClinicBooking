package com.example.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "Medicines")

public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long medicineID;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(length = 50)
    private String strength;

    private BigDecimal unitPrice;

    @Column(length = 255)
    private String note;

    public Medicine() {
    }

    public Medicine(Long medicineID, String name, String strength, BigDecimal unitPrice, String note) {
        this.medicineID = medicineID;
        this.name = name;
        this.strength = strength;
        this.unitPrice = unitPrice;
        this.note = note;
    }

    public Long getMedicineID() {
        return medicineID;
    }

    public void setMedicineID(Long medicineID) {
        this.medicineID = medicineID;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStrength() {
        return strength;
    }

    public void setStrength(String strength) {
        this.strength = strength;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
