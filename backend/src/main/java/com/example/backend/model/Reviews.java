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
@Table(name = "Reviews")
@NamedQueries({
    @NamedQuery(name = "Reviews.findAll", query = "SELECT r FROM Reviews r"),
    @NamedQuery(name = "Reviews.findByReviewID", query = "SELECT r FROM Reviews r WHERE r.reviewID = :reviewID"),
    @NamedQuery(name = "Reviews.findByRating", query = "SELECT r FROM Reviews r WHERE r.rating = :rating"),
    @NamedQuery(name = "Reviews.findByComment", query = "SELECT r FROM Reviews r WHERE r.comment = :comment"),
    @NamedQuery(name = "Reviews.findByCreatedAt", query = "SELECT r FROM Reviews r WHERE r.createdAt = :createdAt"),
    @NamedQuery(name = "Reviews.findByStatus", query = "SELECT r FROM Reviews r WHERE r.status = :status")})
public class Reviews implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "ReviewID")
    private Integer reviewID;
    @Basic(optional = false)
    @NotNull
    @Column(name = "Rating")
    private int rating;
    @Size(max = 255)
    @Column(name = "Comment")
    private String comment;
    @Column(name = "CreatedAt")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Size(max = 20)
    @Column(name = "Status")
    private String status;
    @JoinColumn(name = "DoctorID", referencedColumnName = "DoctorID")
    @ManyToOne(optional = false)
    private Doctors doctorID;
    @JoinColumn(name = "PatientID", referencedColumnName = "PatientID")
    @ManyToOne(optional = false)
    private Patients patientID;

    public Reviews() {
    }

    public Reviews(Integer reviewID) {
        this.reviewID = reviewID;
    }

    public Reviews(Integer reviewID, int rating) {
        this.reviewID = reviewID;
        this.rating = rating;
    }

    public Integer getReviewID() {
        return reviewID;
    }

    public void setReviewID(Integer reviewID) {
        this.reviewID = reviewID;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Doctors getDoctorID() {
        return doctorID;
    }

    public void setDoctorID(Doctors doctorID) {
        this.doctorID = doctorID;
    }

    public Patients getPatientID() {
        return patientID;
    }

    public void setPatientID(Patients patientID) {
        this.patientID = patientID;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (reviewID != null ? reviewID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Reviews)) {
            return false;
        }
        Reviews other = (Reviews) object;
        if ((this.reviewID == null && other.reviewID != null) || (this.reviewID != null && !this.reviewID.equals(other.reviewID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.Reviews[ reviewID=" + reviewID + " ]";
    }
    
}
