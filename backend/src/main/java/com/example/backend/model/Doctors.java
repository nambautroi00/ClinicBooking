/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.backend.model;

import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.util.Collection;

/**
 *
 * @author ASUS
 */
@Entity
@Table(name = "Doctors")
@NamedQueries({
    @NamedQuery(name = "Doctors.findAll", query = "SELECT d FROM Doctors d"),
    @NamedQuery(name = "Doctors.findByDoctorID", query = "SELECT d FROM Doctors d WHERE d.doctorID = :doctorID"),
    @NamedQuery(name = "Doctors.findBySpecialty", query = "SELECT d FROM Doctors d WHERE d.specialty = :specialty"),
    @NamedQuery(name = "Doctors.findByBio", query = "SELECT d FROM Doctors d WHERE d.bio = :bio")})
public class Doctors implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @NotNull
    @Column(name = "DoctorID")
    private Integer doctorID;
    @Size(max = 100)
    @Column(name = "Specialty")
    private String specialty;
    @Size(max = 255)
    @Column(name = "Bio")
    private String bio;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "doctorID")
    private Collection<DoctorSchedules> doctorSchedulesCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "doctorID")
    private Collection<Conversations> conversationsCollection;
    @JoinColumn(name = "DepartmentID", referencedColumnName = "DepartmentID")
    @ManyToOne(optional = false)
    private Departments departmentID;
    @JoinColumn(name = "DoctorID", referencedColumnName = "UserID", insertable = false, updatable = false)
    @OneToOne(optional = false)
    private Users users;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "doctorID")
    private Collection<Reviews> reviewsCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "doctorID")
    private Collection<Appointments> appointmentsCollection;

    public Doctors() {
    }

    public Doctors(Integer doctorID) {
        this.doctorID = doctorID;
    }

    public Integer getDoctorID() {
        return doctorID;
    }

    public void setDoctorID(Integer doctorID) {
        this.doctorID = doctorID;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Collection<DoctorSchedules> getDoctorSchedulesCollection() {
        return doctorSchedulesCollection;
    }

    public void setDoctorSchedulesCollection(Collection<DoctorSchedules> doctorSchedulesCollection) {
        this.doctorSchedulesCollection = doctorSchedulesCollection;
    }

    public Collection<Conversations> getConversationsCollection() {
        return conversationsCollection;
    }

    public void setConversationsCollection(Collection<Conversations> conversationsCollection) {
        this.conversationsCollection = conversationsCollection;
    }

    public Departments getDepartmentID() {
        return departmentID;
    }

    public void setDepartmentID(Departments departmentID) {
        this.departmentID = departmentID;
    }

    public Users getUsers() {
        return users;
    }

    public void setUsers(Users users) {
        this.users = users;
    }

    public Collection<Reviews> getReviewsCollection() {
        return reviewsCollection;
    }

    public void setReviewsCollection(Collection<Reviews> reviewsCollection) {
        this.reviewsCollection = reviewsCollection;
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
        hash += (doctorID != null ? doctorID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Doctors)) {
            return false;
        }
        Doctors other = (Doctors) object;
        if ((this.doctorID == null && other.doctorID != null) || (this.doctorID != null && !this.doctorID.equals(other.doctorID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.Doctors[ doctorID=" + doctorID + " ]";
    }
    
}
