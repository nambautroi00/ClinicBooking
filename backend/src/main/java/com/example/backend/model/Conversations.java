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
import java.io.Serializable;
import java.util.Collection;
import java.util.Date;

/**
 *
 * @author ASUS
 */
@Entity
@Table(name = "Conversations")
@NamedQueries({
    @NamedQuery(name = "Conversations.findAll", query = "SELECT c FROM Conversations c"),
    @NamedQuery(name = "Conversations.findByConversationID", query = "SELECT c FROM Conversations c WHERE c.conversationID = :conversationID"),
    @NamedQuery(name = "Conversations.findByCreatedAt", query = "SELECT c FROM Conversations c WHERE c.createdAt = :createdAt")})
public class Conversations implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "ConversationID")
    private Integer conversationID;
    @Column(name = "CreatedAt")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "conversationID")
    private Collection<Messages> messagesCollection;
    @JoinColumn(name = "DoctorID", referencedColumnName = "DoctorID")
    @ManyToOne(optional = false)
    private Doctors doctorID;
    @JoinColumn(name = "PatientID", referencedColumnName = "PatientID")
    @ManyToOne(optional = false)
    private Patients patientID;

    public Conversations() {
    }

    public Conversations(Integer conversationID) {
        this.conversationID = conversationID;
    }

    public Integer getConversationID() {
        return conversationID;
    }

    public void setConversationID(Integer conversationID) {
        this.conversationID = conversationID;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Collection<Messages> getMessagesCollection() {
        return messagesCollection;
    }

    public void setMessagesCollection(Collection<Messages> messagesCollection) {
        this.messagesCollection = messagesCollection;
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
        hash += (conversationID != null ? conversationID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Conversations)) {
            return false;
        }
        Conversations other = (Conversations) object;
        if ((this.conversationID == null && other.conversationID != null) || (this.conversationID != null && !this.conversationID.equals(other.conversationID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.Conversations[ conversationID=" + conversationID + " ]";
    }
    
}
