package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.model.Article;

public interface ArticleRepository extends JpaRepository<Article, Integer> {
    @Query("SELECT a FROM Article a WHERE a.status IS NULL OR a.status = 'ACTIVE'")
    List<Article> findAllActive();

    @Query("SELECT a FROM Article a WHERE a.articleId = :id AND (a.status IS NULL OR a.status = 'ACTIVE')")
    Optional<Article> findActiveById(@Param("id") Integer id);
}

