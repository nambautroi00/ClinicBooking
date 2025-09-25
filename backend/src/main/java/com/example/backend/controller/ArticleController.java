package com.example.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.ArticleDTO;
import com.example.backend.service.ArticleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {
    private final ArticleService articleService;

    @PostMapping
    public ResponseEntity<ArticleDTO> create(@Valid @RequestBody ArticleDTO dto) {
        return ResponseEntity.ok(articleService.createArticle(dto));
    }

    @GetMapping
    public ResponseEntity<List<ArticleDTO>> getAll() {
        return ResponseEntity.ok(articleService.getAllArticles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArticleDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(articleService.getArticle(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArticleDTO> update(@PathVariable Integer id, @Valid @RequestBody ArticleDTO dto) {
        return ResponseEntity.ok(articleService.updateArticle(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok().build();
    }
}


