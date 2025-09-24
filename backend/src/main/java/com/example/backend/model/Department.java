package com.example.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long departmentID;

    @Column(nullable = false, length = 100)
    private String departmentName;

    @Column(length = 255)
    private String description;

    @Column(length = 20)
    private String status;

    public Department() {
    }

    public Department(Long departmentID, String departmentName, String description, String status) {
        this.departmentID = departmentID;
        this.departmentName = departmentName;
        this.description = description;
        this.status = status;
    }

    public Long getDepartmentID() {
        return departmentID;
    }

    public void setDepartmentID(Long departmentID) {
        this.departmentID = departmentID;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
