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
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.util.Date;

/**
 *
 * @author ASUS
 */
@Entity
@Table(name = "SystemNotifications")
@NamedQueries({
    @NamedQuery(name = "SystemNotifications.findAll", query = "SELECT s FROM SystemNotifications s"),
    @NamedQuery(name = "SystemNotifications.findByNotificationID", query = "SELECT s FROM SystemNotifications s WHERE s.notificationID = :notificationID"),
    @NamedQuery(name = "SystemNotifications.findByTitle", query = "SELECT s FROM SystemNotifications s WHERE s.title = :title"),
    @NamedQuery(name = "SystemNotifications.findByMessage", query = "SELECT s FROM SystemNotifications s WHERE s.message = :message"),
    @NamedQuery(name = "SystemNotifications.findByCreatedAt", query = "SELECT s FROM SystemNotifications s WHERE s.createdAt = :createdAt")})
public class SystemNotifications implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "NotificationID")
    private Integer notificationID;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 200)
    @Column(name = "Title")
    private String title;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 2147483647)
    @Column(name = "Message")
    private String message;
    @Column(name = "CreatedAt")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @JoinColumn(name = "AppointmentID", referencedColumnName = "AppointmentID")
    @ManyToOne
    private Appointments appointmentID;

    public SystemNotifications() {
    }

    public SystemNotifications(Integer notificationID) {
        this.notificationID = notificationID;
    }

    public SystemNotifications(Integer notificationID, String title, String message) {
        this.notificationID = notificationID;
        this.title = title;
        this.message = message;
    }

    public Integer getNotificationID() {
        return notificationID;
    }

    public void setNotificationID(Integer notificationID) {
        this.notificationID = notificationID;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (notificationID != null ? notificationID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof SystemNotifications)) {
            return false;
        }
        SystemNotifications other = (SystemNotifications) object;
        if ((this.notificationID == null && other.notificationID != null) || (this.notificationID != null && !this.notificationID.equals(other.notificationID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.SystemNotifications[ notificationID=" + notificationID + " ]";
    }
    
}
