package com.example.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.ConversationDTO;
import com.example.backend.service.ConversationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ConversationDTO.Response> createConversation(@Valid @RequestBody ConversationDTO.Create dto) {
        ConversationDTO.Response created = conversationService.createConversation(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationDTO.Response> getConversationById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(conversationService.getConversationById(id));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ConversationDTO.Response> getConversationWithMessages(@PathVariable("id") Long id) {
        return ResponseEntity.ok(conversationService.getConversationByIdWithMessages(id));
    }

    @GetMapping("/by-patient")
    public ResponseEntity<List<ConversationDTO.Response>> getConversationsByPatient(@RequestParam("patientId") Long patientId) {
        return ResponseEntity.ok(conversationService.getConversationsByPatient(patientId));
    }

    @GetMapping("/by-doctor")
    public ResponseEntity<List<ConversationDTO.Response>> getConversationsByDoctor(@RequestParam("doctorId") Long doctorId) {
        return ResponseEntity.ok(conversationService.getConversationsByDoctor(doctorId));
    }

    @GetMapping("/by-patient-and-doctor")
    public ResponseEntity<ConversationDTO.Response> getConversationByPatientAndDoctor(
            @RequestParam("patientId") Long patientId,
            @RequestParam("doctorId") Long doctorId) {
        Optional<ConversationDTO.Response> conversation = conversationService.getConversationByPatientAndDoctor(patientId, doctorId);
        return conversation.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/count/by-patient")
    public ResponseEntity<Long> getConversationCountByPatient(@RequestParam("patientId") Long patientId) {
        return ResponseEntity.ok(conversationService.getConversationCountByPatient(patientId));
    }

    @GetMapping("/count/by-doctor")
    public ResponseEntity<Long> getConversationCountByDoctor(@RequestParam("doctorId") Long doctorId) {
        return ResponseEntity.ok(conversationService.getConversationCountByDoctor(doctorId));
    }

    @GetMapping("/{id}/latest-messages")
    public ResponseEntity<ConversationDTO.Response> getConversationWithLatestMessages(
            @PathVariable("id") Long id,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        return ResponseEntity.ok(conversationService.getConversationWithLatestMessages(id, limit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable("id") Long id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }
}
