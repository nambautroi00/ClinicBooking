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
@Table(name = "Articles")
@NamedQueries({
    @NamedQuery(name = "Articles.findAll", query = "SELECT a FROM Articles a"),
    @NamedQuery(name = "Articles.findByArticleID", query = "SELECT a FROM Articles a WHERE a.articleID = :articleID"),
    @NamedQuery(name = "Articles.findByTitle", query = "SELECT a FROM Articles a WHERE a.title = :title"),
    @NamedQuery(name = "Articles.findByContent", query = "SELECT a FROM Articles a WHERE a.content = :content"),
    @NamedQuery(name = "Articles.findByImageURL", query = "SELECT a FROM Articles a WHERE a.imageURL = :imageURL"),
    @NamedQuery(name = "Articles.findByCreatedAt", query = "SELECT a FROM Articles a WHERE a.createdAt = :createdAt"),
    @NamedQuery(name = "Articles.findByStatus", query = "SELECT a FROM Articles a WHERE a.status = :status")})
public class Articles implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "ArticleID")
    private Integer articleID;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 200)
    @Column(name = "Title")
    private String title;
    @Size(max = 2147483647)
    @Column(name = "Content")
    private String content;
    @Size(max = 500)
    @Column(name = "ImageURL")
    private String imageURL;
    @Column(name = "CreatedAt")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Size(max = 20)
    @Column(name = "Status")
    private String status;
    @JoinColumn(name = "AuthorID", referencedColumnName = "UserID")
    @ManyToOne(optional = false)
    private Users authorID;

    public Articles() {
    }

    public Articles(Integer articleID) {
        this.articleID = articleID;
    }

    public Articles(Integer articleID, String title) {
        this.articleID = articleID;
        this.title = title;
    }

    public Integer getArticleID() {
        return articleID;
    }

    public void setArticleID(Integer articleID) {
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

    public Users getAuthorID() {
        return authorID;
    }

    public void setAuthorID(Users authorID) {
        this.authorID = authorID;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (articleID != null ? articleID.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Articles)) {
            return false;
        }
        Articles other = (Articles) object;
        if ((this.articleID == null && other.articleID != null) || (this.articleID != null && !this.articleID.equals(other.articleID))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.example.backend.model.Articles[ articleID=" + articleID + " ]";
    }
    
}
