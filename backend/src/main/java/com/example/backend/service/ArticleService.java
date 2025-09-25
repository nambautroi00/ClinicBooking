package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.ArticleDTO;
import com.example.backend.model.Article;
import com.example.backend.model.User;
import com.example.backend.repository.ArticleRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ArticleService {
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;

    @Transactional
    public ArticleDTO createArticle(ArticleDTO dto) {
        User author = userRepository.findById(dto.getAuthorId())
                .orElseThrow(() -> new RuntimeException("Author not found"));

        Article a = new Article();
        a.setTitle(dto.getTitle());
        a.setContent(dto.getContent());
        a.setImageUrl(dto.getImageUrl());
        a.setAuthor(author);
        if(dto.getCreatedAt() != null) {
            a.setCreatedAt(LocalDateTime.parse(dto.getCreatedAt()));
        }
        a.setStatus("ACTIVE");
        return toDTO(articleRepository.save(a));
    }

    public List<ArticleDTO> getAllArticles() {
        return articleRepository.findAllActive().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ArticleDTO getArticle(Integer id) {
        Article a = articleRepository.findActiveById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
        return toDTO(a);
    }

    @Transactional
    public ArticleDTO updateArticle(Integer id, ArticleDTO dto) {
        Article a = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
        if (dto.getTitle() != null) a.setTitle(dto.getTitle());
        a.setContent(dto.getContent());
        a.setImageUrl(dto.getImageUrl());
        return toDTO(articleRepository.save(a));
    }

    @Transactional
    public void deleteArticle(Integer id) {
        Article a = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
        a.setStatus("INACTIVE");
        articleRepository.save(a);
    }

    private ArticleDTO toDTO(Article a) {
        ArticleDTO dto = new ArticleDTO();
        dto.setArticleId(a.getArticleId());
        dto.setTitle(a.getTitle());
        dto.setContent(a.getContent());
        dto.setImageUrl(a.getImageUrl());
        dto.setAuthorId(a.getAuthor().getUserId());
        dto.setCreatedAt(a.getCreatedAt() != null ? a.getCreatedAt().toLocalDate().toString() : null);
        dto.setStatus(a.getStatus());
        return dto;
    }
}


