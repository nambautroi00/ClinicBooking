package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageID;

    @ManyToOne
    @JoinColumn(name = "conversationID", nullable = false)
    private Conversation conversation;

    @ManyToOne
    @JoinColumn(name = "senderID", nullable = false)
    private User sender;

    @Lob
    private String content;

    @Column(length = 500)
    private String attachmentURL;

    private LocalDateTime sentAt;

    public Message() {
    }

    public Message(Long messageID, Conversation conversation, User sender, String content, String attachmentURL, LocalDateTime sentAt) {
        this.messageID = messageID;
        this.conversation = conversation;
        this.sender = sender;
        this.content = content;
        this.attachmentURL = attachmentURL;
        this.sentAt = sentAt;
    }

    public Long getMessageID() {
        return messageID;
    }

    public void setMessageID(Long messageID) {
        this.messageID = messageID;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
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

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
}
