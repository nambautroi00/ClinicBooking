package com.example.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Doctors")
public class Doctor {
    @Id
    private Long doctorID; // = Users.userID

    @OneToOne
    @MapsId
    @JoinColumn(name = "doctorID")
    private User user;

    @ManyToOne
    @JoinColumn(name = "departmentID", nullable = false)
    private Department department;

    @Column(length = 100)
    private String specialty;

    @Column(length = 255)
    private String bio;

    public Doctor() {
    }

    public Doctor(Long doctorID, User user, Department department, String specialty, String bio) {
        this.doctorID = doctorID;
        this.user = user;
        this.department = department;
        this.specialty = specialty;
        this.bio = bio;
    }

    public Long getDoctorID() {
        return doctorID;
    }

    public void setDoctorID(Long doctorID) {
        this.doctorID = doctorID;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
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

}
