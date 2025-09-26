/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.backend.model;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

/**
 *
 * @author ASUS
 */
@Entity
@Table(name = "PrescriptionItems")
@NamedQueries({
    @NamedQuery(name = "PrescriptionItems.findAll", query = "SELECT p FROM PrescriptionItems p"),
    @NamedQuery(name = "PrescriptionItems.findByItemID", query = "SELECT p FROM PrescriptionItems p WHERE p.itemID = :itemID"),
    @NamedQuery(name = "PrescriptionItems.findByDosage", query = "SELECT p FROM PrescriptionItems p WHERE p.dosage = :dosage"),
    @NamedQuery(name = "PrescriptionItems.findByDuration", query = "SELECT p FROM PrescriptionItems p WHERE p.duration = :duration"),
    @NamedQuery(name = "PrescriptionItems.findByNote", query = "SELECT p FROM PrescriptionItems p WHERE p.note = :note")})
public class PrescriptionItems implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "ItemID")
    private Integer itemID;
    @Size(max = 50)
    @Column(name = "Dosage")
    private String dosage;
    @Size(max = 50)
    @Column(name = "Duration")
    private String duration;
    @Size(max = 255)
    @Column(name = "Note")
    private String note;
    @JoinColumn(name = "MedicineID", referencedColumnName = "MedicineID")
    @ManyToOne(optional = false)
    private Medicines medicineID;
    @JoinColumn(name = "PrescriptionID", referencedColumnName = "PrescriptionID")
    @ManyToOne(optional = false)
    private Prescriptions prescriptionID;

    public PrescriptionItems() {
    }

    public PrescriptionItems(Integer itemID) {
        this.itemID = itemID;
    }

    public Integer getItemID() {
        return itemID;
    }

    public void setItemID(Integer itemID) {
        this.itemID = itemID;
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

    public Medicines getMedicineID() {
        return medicineID;
    }

    public void setMedicineID(Medicines medicineID) {
        this.medicineID = medicineID;
    }

    public Prescriptions getPrescriptionID() {
        return prescriptionID;
    }

    public void setPrescriptionID(Prescriptions prescriptionID) {
        this.prescriptionID = prescriptionID;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (itemID != null ? itemID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof PrescriptionItems)) {
            return false;
        }
        PrescriptionItems other = (PrescriptionItems) object;
        if ((this.itemID == null && other.itemID != null) || (this.itemID != null && !this.itemID.equals(other.itemID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.PrescriptionItems[ itemID=" + itemID + " ]";
    }
    
}
