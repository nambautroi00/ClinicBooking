package com.example.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.model.Article;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    @Query("SELECT a FROM Article a LEFT JOIN FETCH a.author WHERE " +
           "(:title IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:authorId IS NULL OR a.author.id = :authorId)")
    Page<Article> findArticlesWithFilters(
            @Param("title") String title,
            @Param("status") String status,
            @Param("authorId") Long authorId,
            Pageable pageable
    );
}


