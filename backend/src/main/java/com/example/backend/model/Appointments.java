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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.util.Collection;
import java.util.Date;

/**
 *
 * @author ASUS
 */
@Entity
@Table(name = "Appointments")
@NamedQueries({
    @NamedQuery(name = "Appointments.findAll", query = "SELECT a FROM Appointments a"),
    @NamedQuery(name = "Appointments.findByAppointmentID", query = "SELECT a FROM Appointments a WHERE a.appointmentID = :appointmentID"),
    @NamedQuery(name = "Appointments.findByAppointmentTime", query = "SELECT a FROM Appointments a WHERE a.appointmentTime = :appointmentTime"),
    @NamedQuery(name = "Appointments.findByStatus", query = "SELECT a FROM Appointments a WHERE a.status = :status"),
    @NamedQuery(name = "Appointments.findByNotes", query = "SELECT a FROM Appointments a WHERE a.notes = :notes")})
public class Appointments implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "AppointmentID")
    private Integer appointmentID;
    @Basic(optional = false)
    @NotNull
    @Column(name = "AppointmentTime")
    @Temporal(TemporalType.TIMESTAMP)
    private Date appointmentTime;
    @Size(max = 30)
    @Column(name = "Status")
    private String status;
    @Size(max = 255)
    @Column(name = "Notes")
    private String notes;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "appointmentID")
    private Collection<Payments> paymentsCollection;
    @JoinColumn(name = "DoctorID", referencedColumnName = "DoctorID")
    @ManyToOne(optional = false)
    private Doctors doctorID;
    @JoinColumn(name = "ScheduleID", referencedColumnName = "ScheduleID")
    @ManyToOne
    private DoctorSchedules scheduleID;
    @JoinColumn(name = "PatientID", referencedColumnName = "PatientID")
    @ManyToOne(optional = false)
    private Patients patientID;
    @OneToMany(mappedBy = "appointmentID")
    private Collection<SystemNotifications> systemNotificationsCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "appointmentID")
    private Collection<MedicalRecords> medicalRecordsCollection;

    public Appointments() {
    }

    public Appointments(Integer appointmentID) {
        this.appointmentID = appointmentID;
    }

    public Appointments(Integer appointmentID, Date appointmentTime) {
        this.appointmentID = appointmentID;
        this.appointmentTime = appointmentTime;
    }

    public Integer getAppointmentID() {
        return appointmentID;
    }

    public void setAppointmentID(Integer appointmentID) {
        this.appointmentID = appointmentID;
    }

    public Date getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(Date appointmentTime) {
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

    public Collection<Payments> getPaymentsCollection() {
        return paymentsCollection;
    }

    public void setPaymentsCollection(Collection<Payments> paymentsCollection) {
        this.paymentsCollection = paymentsCollection;
    }

    public Doctors getDoctorID() {
        return doctorID;
    }

    public void setDoctorID(Doctors doctorID) {
        this.doctorID = doctorID;
    }

    public DoctorSchedules getScheduleID() {
        return scheduleID;
    }

    public void setScheduleID(DoctorSchedules scheduleID) {
        this.scheduleID = scheduleID;
    }

    public Patients getPatientID() {
        return patientID;
    }

    public void setPatientID(Patients patientID) {
        this.patientID = patientID;
    }

    public Collection<SystemNotifications> getSystemNotificationsCollection() {
        return systemNotificationsCollection;
    }

    public void setSystemNotificationsCollection(Collection<SystemNotifications> systemNotificationsCollection) {
        this.systemNotificationsCollection = systemNotificationsCollection;
    }

    public Collection<MedicalRecords> getMedicalRecordsCollection() {
        return medicalRecordsCollection;
    }

    public void setMedicalRecordsCollection(Collection<MedicalRecords> medicalRecordsCollection) {
        this.medicalRecordsCollection = medicalRecordsCollection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (appointmentID != null ? appointmentID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Appointments)) {
            return false;
        }
        Appointments other = (Appointments) object;
        if ((this.appointmentID == null && other.appointmentID != null) || (this.appointmentID != null && !this.appointmentID.equals(other.appointmentID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.Appointments[ appointmentID=" + appointmentID + " ]";
    }
    
}
