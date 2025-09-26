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
@Table(name = "MedicalRecords")
@NamedQueries({
    @NamedQuery(name = "MedicalRecords.findAll", query = "SELECT m FROM MedicalRecords m"),
    @NamedQuery(name = "MedicalRecords.findByRecordID", query = "SELECT m FROM MedicalRecords m WHERE m.recordID = :recordID"),
    @NamedQuery(name = "MedicalRecords.findByDiagnosis", query = "SELECT m FROM MedicalRecords m WHERE m.diagnosis = :diagnosis"),
    @NamedQuery(name = "MedicalRecords.findByAdvice", query = "SELECT m FROM MedicalRecords m WHERE m.advice = :advice"),
    @NamedQuery(name = "MedicalRecords.findByCreatedAt", query = "SELECT m FROM MedicalRecords m WHERE m.createdAt = :createdAt")})
public class MedicalRecords implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "RecordID")
    private Integer recordID;
    @Size(max = 255)
    @Column(name = "Diagnosis")
    private String diagnosis;
    @Size(max = 255)
    @Column(name = "Advice")
    private String advice;
    @Column(name = "CreatedAt")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @JoinColumn(name = "AppointmentID", referencedColumnName = "AppointmentID")
    @ManyToOne(optional = false)
    private Appointments appointmentID;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "recordID")
    private Collection<Prescriptions> prescriptionsCollection;

    public MedicalRecords() {
    }

    public MedicalRecords(Integer recordID) {
        this.recordID = recordID;
    }

    public Integer getRecordID() {
        return recordID;
    }

    public void setRecordID(Integer recordID) {
        this.recordID = recordID;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getAdvice() {
        return advice;
    }

    public void setAdvice(String advice) {
        this.advice = advice;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Appointments getAppointmentID() {
        return appointmentID;
    }

    public void setAppointmentID(Appointments appointmentID) {
        this.appointmentID = appointmentID;
    }

    public Collection<Prescriptions> getPrescriptionsCollection() {
        return prescriptionsCollection;
    }

    public void setPrescriptionsCollection(Collection<Prescriptions> prescriptionsCollection) {
        this.prescriptionsCollection = prescriptionsCollection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (recordID != null ? recordID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof MedicalRecords)) {
            return false;
        }
        MedicalRecords other = (MedicalRecords) object;
        if ((this.recordID == null && other.recordID != null) || (this.recordID != null && !this.recordID.equals(other.recordID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.MedicalRecords[ recordID=" + recordID + " ]";
    }
    
}
