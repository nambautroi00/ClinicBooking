/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.backend.model;

import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.util.Collection;
import java.util.Date;

/**
 *
 * @author ASUS
 */
@Entity
@Table(name = "Prescriptions")
@NamedQueries({
    @NamedQuery(name = "Prescriptions.findAll", query = "SELECT p FROM Prescriptions p"),
    @NamedQuery(name = "Prescriptions.findByPrescriptionID", query = "SELECT p FROM Prescriptions p WHERE p.prescriptionID = :prescriptionID"),
    @NamedQuery(name = "Prescriptions.findByCreatedAt", query = "SELECT p FROM Prescriptions p WHERE p.createdAt = :createdAt"),
    @NamedQuery(name = "Prescriptions.findByNotes", query = "SELECT p FROM Prescriptions p WHERE p.notes = :notes")})
public class Prescriptions implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "PrescriptionID")
    private Integer prescriptionID;
    @Column(name = "CreatedAt")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Size(max = 255)
    @Column(name = "Notes")
    private String notes;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "prescriptionID")
    private Collection<PrescriptionItems> prescriptionItemsCollection;
    @JoinColumn(name = "RecordID", referencedColumnName = "RecordID")
    @ManyToOne(optional = false)
    private MedicalRecords recordID;

    public Prescriptions() {
    }

    public Prescriptions(Integer prescriptionID) {
        this.prescriptionID = prescriptionID;
    }

    public Integer getPrescriptionID() {
        return prescriptionID;
    }

    public void setPrescriptionID(Integer prescriptionID) {
        this.prescriptionID = prescriptionID;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Collection<PrescriptionItems> getPrescriptionItemsCollection() {
        return prescriptionItemsCollection;
    }

    public void setPrescriptionItemsCollection(Collection<PrescriptionItems> prescriptionItemsCollection) {
        this.prescriptionItemsCollection = prescriptionItemsCollection;
    }

    public MedicalRecords getRecordID() {
        return recordID;
    }

    public void setRecordID(MedicalRecords recordID) {
        this.recordID = recordID;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (prescriptionID != null ? prescriptionID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Prescriptions)) {
            return false;
        }
        Prescriptions other = (Prescriptions) object;
        if ((this.prescriptionID == null && other.prescriptionID != null) || (this.prescriptionID != null && !this.prescriptionID.equals(other.prescriptionID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.Prescriptions[ prescriptionID=" + prescriptionID + " ]";
    }
    
}
