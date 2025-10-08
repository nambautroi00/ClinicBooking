package com.example.backend.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.backend.dto.ConversationDTO;
import com.example.backend.dto.MessageDTO;
import com.example.backend.model.Conversation;
import com.example.backend.model.Doctor;
import com.example.backend.model.Patient;

@Component
public class ConversationMapper {

    @Autowired
    private MessageMapper messageMapper;

    public Conversation createDTOToEntity(ConversationDTO.Create dto, Patient patient, Doctor doctor) {
        Conversation entity = new Conversation();
        entity.setPatient(patient);
        entity.setDoctor(doctor);
        entity.setCreatedAt(java.time.LocalDateTime.now());
        return entity;
    }

    public ConversationDTO.Response entityToResponseDTO(Conversation entity) {
        ConversationDTO.Response dto = new ConversationDTO.Response();
        dto.setConversationId(entity.getConversationId());
        
        if (entity.getPatient() != null) {
            dto.setPatientId(entity.getPatient().getPatientId());
            if (entity.getPatient().getUser() != null) {
                dto.setPatientName(entity.getPatient().getUser().getFirstName() + " " + 
                                 entity.getPatient().getUser().getLastName());
            }
        }
        
        if (entity.getDoctor() != null) {
            dto.setDoctorId(entity.getDoctor().getDoctorId());
            if (entity.getDoctor().getUser() != null) {
                dto.setDoctorName(entity.getDoctor().getUser().getFirstName() + " " + 
                                entity.getDoctor().getUser().getLastName());
            }
        }
        
        dto.setCreatedAt(entity.getCreatedAt());
        
        // Map messages if available
        if (entity.getMessages() != null && !entity.getMessages().isEmpty()) {
            dto.setMessages(entity.getMessages().stream()
                .map(messageMapper::entityToResponseDTO)
                .collect(Collectors.toList()));
            dto.setMessageCount((long) entity.getMessages().size());
            
            // Get last message time
            entity.getMessages().stream()
                .max((m1, m2) -> m1.getSentAt().compareTo(m2.getSentAt()))
                .ifPresent(lastMessage -> dto.setLastMessageTime(lastMessage.getSentAt()));
        } else {
            dto.setMessageCount(0L);
        }
        
        return dto;
    }

    public ConversationDTO.Response entityToResponseDTOWithMessages(Conversation entity, List<MessageDTO.Response> messages) {
        ConversationDTO.Response dto = entityToResponseDTO(entity);
        dto.setMessages(messages);
        dto.setMessageCount((long) messages.size());
        
        if (!messages.isEmpty()) {
            messages.stream()
                .max((m1, m2) -> m1.getSentAt().compareTo(m2.getSentAt()))
                .ifPresent(lastMessage -> dto.setLastMessageTime(lastMessage.getSentAt()));
        }
        
        return dto;
    }
}
