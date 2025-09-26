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
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.util.Date;

/**
 *
 * @author ASUS
 */
@Entity
@Table(name = "Messages")
@NamedQueries({
    @NamedQuery(name = "Messages.findAll", query = "SELECT m FROM Messages m"),
    @NamedQuery(name = "Messages.findByMessageID", query = "SELECT m FROM Messages m WHERE m.messageID = :messageID"),
    @NamedQuery(name = "Messages.findByContent", query = "SELECT m FROM Messages m WHERE m.content = :content"),
    @NamedQuery(name = "Messages.findByAttachmentURL", query = "SELECT m FROM Messages m WHERE m.attachmentURL = :attachmentURL"),
    @NamedQuery(name = "Messages.findBySentAt", query = "SELECT m FROM Messages m WHERE m.sentAt = :sentAt")})
public class Messages implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "MessageID")
    private Integer messageID;
    @Size(max = 2147483647)
    @Column(name = "Content")
    private String content;
    @Size(max = 500)
    @Column(name = "AttachmentURL")
    private String attachmentURL;
    @Column(name = "SentAt")
    @Temporal(TemporalType.TIMESTAMP)
    private Date sentAt;
    @JoinColumn(name = "ConversationID", referencedColumnName = "ConversationID")
    @ManyToOne(optional = false)
    private Conversations conversationID;
    @JoinColumn(name = "SenderID", referencedColumnName = "UserID")
    @ManyToOne(optional = false)
    private Users senderID;

    public Messages() {
    }

    public Messages(Integer messageID) {
        this.messageID = messageID;
    }

    public Integer getMessageID() {
        return messageID;
    }

    public void setMessageID(Integer messageID) {
        this.messageID = messageID;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getAttachmentURL() {
        return attachmentURL;
    }

    public void setAttachmentURL(String attachmentURL) {
        this.attachmentURL = attachmentURL;
    }

    public Date getSentAt() {
        return sentAt;
    }

    public void setSentAt(Date sentAt) {
        this.sentAt = sentAt;
    }

    public Conversations getConversationID() {
        return conversationID;
    }

    public void setConversationID(Conversations conversationID) {
        this.conversationID = conversationID;
    }

    public Users getSenderID() {
        return senderID;
    }

    public void setSenderID(Users senderID) {
        this.senderID = senderID;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (messageID != null ? messageID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Messages)) {
            return false;
        }
        Messages other = (Messages) object;
        if ((this.messageID == null && other.messageID != null) || (this.messageID != null && !this.messageID.equals(other.messageID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.Messages[ messageID=" + messageID + " ]";
    }
    
}
