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
@Table(name = "DoctorSchedules")
@NamedQueries({
    @NamedQuery(name = "DoctorSchedules.findAll", query = "SELECT d FROM DoctorSchedules d"),
    @NamedQuery(name = "DoctorSchedules.findByScheduleID", query = "SELECT d FROM DoctorSchedules d WHERE d.scheduleID = :scheduleID"),
    @NamedQuery(name = "DoctorSchedules.findByWorkDate", query = "SELECT d FROM DoctorSchedules d WHERE d.workDate = :workDate"),
    @NamedQuery(name = "DoctorSchedules.findByStartTime", query = "SELECT d FROM DoctorSchedules d WHERE d.startTime = :startTime"),
    @NamedQuery(name = "DoctorSchedules.findByEndTime", query = "SELECT d FROM DoctorSchedules d WHERE d.endTime = :endTime"),
    @NamedQuery(name = "DoctorSchedules.findByStatus", query = "SELECT d FROM DoctorSchedules d WHERE d.status = :status"),
    @NamedQuery(name = "DoctorSchedules.findByNotes", query = "SELECT d FROM DoctorSchedules d WHERE d.notes = :notes")})
public class DoctorSchedules implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "ScheduleID")
    private Integer scheduleID;
    @Basic(optional = false)
    @NotNull
    @Column(name = "WorkDate")
    @Temporal(TemporalType.DATE)
    private Date workDate;
    @Basic(optional = false)
    @NotNull
    @Column(name = "StartTime")
    @Temporal(TemporalType.TIME)
    private Date startTime;
    @Basic(optional = false)
    @NotNull
    @Column(name = "EndTime")
    @Temporal(TemporalType.TIME)
    private Date endTime;
    @Size(max = 20)
    @Column(name = "Status")
    private String status;
    @Size(max = 255)
    @Column(name = "Notes")
    private String notes;
    @JoinColumn(name = "DoctorID", referencedColumnName = "DoctorID")
    @ManyToOne(optional = false)
    private Doctors doctorID;
    @OneToMany(mappedBy = "scheduleID")
    private Collection<Appointments> appointmentsCollection;

    public DoctorSchedules() {
    }

    public DoctorSchedules(Integer scheduleID) {
        this.scheduleID = scheduleID;
    }

    public DoctorSchedules(Integer scheduleID, Date workDate, Date startTime, Date endTime) {
        this.scheduleID = scheduleID;
        this.workDate = workDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Integer getScheduleID() {
        return scheduleID;
    }

    public void setScheduleID(Integer scheduleID) {
        this.scheduleID = scheduleID;
    }

    public Date getWorkDate() {
        return workDate;
    }

    public void setWorkDate(Date workDate) {
        this.workDate = workDate;
    }

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Date getEndTime() {
        return endTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
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

    public Doctors getDoctorID() {
        return doctorID;
    }

    public void setDoctorID(Doctors doctorID) {
        this.doctorID = doctorID;
    }

    public Collection<Appointments> getAppointmentsCollection() {
        return appointmentsCollection;
    }

    public void setAppointmentsCollection(Collection<Appointments> appointmentsCollection) {
        this.appointmentsCollection = appointmentsCollection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (scheduleID != null ? scheduleID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof DoctorSchedules)) {
            return false;
        }
        DoctorSchedules other = (DoctorSchedules) object;
        if ((this.scheduleID == null && other.scheduleID != null) || (this.scheduleID != null && !this.scheduleID.equals(other.scheduleID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.DoctorSchedules[ scheduleID=" + scheduleID + " ]";
    }
    
}
