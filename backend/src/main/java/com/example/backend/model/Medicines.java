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
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Collection;

/**
 *
 * @author ASUS
 */
@Entity
@Table(name = "Medicines")
@NamedQueries({
    @NamedQuery(name = "Medicines.findAll", query = "SELECT m FROM Medicines m"),
    @NamedQuery(name = "Medicines.findByMedicineID", query = "SELECT m FROM Medicines m WHERE m.medicineID = :medicineID"),
    @NamedQuery(name = "Medicines.findByName", query = "SELECT m FROM Medicines m WHERE m.name = :name"),
    @NamedQuery(name = "Medicines.findByStrength", query = "SELECT m FROM Medicines m WHERE m.strength = :strength"),
    @NamedQuery(name = "Medicines.findByUnitPrice", query = "SELECT m FROM Medicines m WHERE m.unitPrice = :unitPrice"),
    @NamedQuery(name = "Medicines.findByNote", query = "SELECT m FROM Medicines m WHERE m.note = :note")})
public class Medicines implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "MedicineID")
    private Integer medicineID;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 150)
    @Column(name = "Name")
    private String name;
    @Size(max = 50)
    @Column(name = "Strength")
    private String strength;
    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Column(name = "UnitPrice")
    private BigDecimal unitPrice;
    @Size(max = 255)
    @Column(name = "Note")
    private String note;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "medicineID")
    private Collection<PrescriptionItems> prescriptionItemsCollection;

    public Medicines() {
    }

    public Medicines(Integer medicineID) {
        this.medicineID = medicineID;
    }

    public Medicines(Integer medicineID, String name) {
        this.medicineID = medicineID;
        this.name = name;
    }

    public Integer getMedicineID() {
        return medicineID;
    }

    public void setMedicineID(Integer medicineID) {
        this.medicineID = medicineID;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStrength() {
        return strength;
    }

    public void setStrength(String strength) {
        this.strength = strength;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Collection<PrescriptionItems> getPrescriptionItemsCollection() {
        return prescriptionItemsCollection;
    }

    public void setPrescriptionItemsCollection(Collection<PrescriptionItems> prescriptionItemsCollection) {
        this.prescriptionItemsCollection = prescriptionItemsCollection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (medicineID != null ? medicineID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Medicines)) {
            return false;
        }
        Medicines other = (Medicines) object;
        if ((this.medicineID == null && other.medicineID != null) || (this.medicineID != null && !this.medicineID.equals(other.medicineID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.Medicines[ medicineID=" + medicineID + " ]";
    }
    
}
