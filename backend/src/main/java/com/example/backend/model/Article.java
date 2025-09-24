package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Articles")
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long articleID;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    private String content;

    @Column(length = 500)
    private String imageURL;

    @ManyToOne
    @JoinColumn(name = "authorID", nullable = false)
    private User author;

    private LocalDateTime createdAt;

    @Column(length = 20)
    private String status;

    public Long getArticleID() {
        return articleID;
    }

    public void setArticleID(Long articleID) {
        this.articleID = articleID;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageURL() {
        return imageURL;
    }

    public void setImageURL(String imageURL) {
        this.imageURL = imageURL;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Article() {
    }

    public Article(Long articleID, String title, String content, String imageURL, User author, LocalDateTime createdAt, String status) {
        this.articleID = articleID;
        this.title = title;
        this.content = content;
        this.imageURL = imageURL;
        this.author = author;
        this.createdAt = createdAt;
        this.status = status;
    }

    @Override
    public String toString() {
        return "Article{" +
                "articleID=" + articleID +
                ", title='" + title + '\'' +
                ", content='" + content + '\'' +
                ", imageURL='" + imageURL + '\'' +
                ", author=" + author +
                ", createdAt=" + createdAt +
                ", status='" + status + '\'' +
                '}';
    }
}
