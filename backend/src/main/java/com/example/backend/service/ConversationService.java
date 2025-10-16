package com.example.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.ConversationDTO;
import com.example.backend.dto.MessageDTO;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.ConversationMapper;
import com.example.backend.model.Conversation;
import com.example.backend.model.Doctor;
import com.example.backend.model.Patient;
import com.example.backend.repository.ConversationRepository;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MessageRepository messageRepository;
    private final ConversationMapper conversationMapper;

    public ConversationDTO.Response createConversation(ConversationDTO.Create dto) {
        // Validate patient and doctor exist
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với ID: " + dto.getPatientId()));
        
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bác sĩ với ID: " + dto.getDoctorId()));

        // Check if conversation already exists
        Optional<Conversation> existingConversation = conversationRepository
                .findByPatientIdAndDoctorId(dto.getPatientId(), dto.getDoctorId());
        
        if (existingConversation.isPresent()) {
            // Return existing conversation instead of throwing exception
            return conversationMapper.entityToResponseDTO(existingConversation.get());
        }

        // Create new conversation
        Conversation conversation = conversationMapper.createDTOToEntity(dto, patient, doctor);
        Conversation savedConversation = conversationRepository.save(conversation);
        
        return conversationMapper.entityToResponseDTO(savedConversation);
    }

    @Transactional(readOnly = true)
    public ConversationDTO.Response getConversationById(Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc trò chuyện với ID: " + conversationId));
        
        return conversationMapper.entityToResponseDTO(conversation);
    }

    @Transactional(readOnly = true)
    public ConversationDTO.Response getConversationByIdWithMessages(Long conversationId) {
        Conversation conversation = conversationRepository.findByIdWithMessages(conversationId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc trò chuyện với ID: " + conversationId));
        
        return conversationMapper.entityToResponseDTO(conversation);
    }

    @Transactional(readOnly = true)
    public List<ConversationDTO.Response> getConversationsByPatient(Long patientId) {
        List<Conversation> conversations = conversationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return conversations.stream()
                .map(conversationMapper::entityToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConversationDTO.Response> getConversationsByDoctor(Long doctorId) {
        List<Conversation> conversations = conversationRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
        return conversations.stream()
                .map(conversationMapper::entityToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ConversationDTO.Response> getConversationByPatientAndDoctor(Long patientId, Long doctorId) {
        Optional<Conversation> conversation = conversationRepository
                .findByPatientIdAndDoctorId(patientId, doctorId);
        
        return conversation.map(conversationMapper::entityToResponseDTO);
    }

    @Transactional(readOnly = true)
    public Long getConversationCountByPatient(Long patientId) {
        return conversationRepository.countByPatientId(patientId);
    }

    @Transactional(readOnly = true)
    public Long getConversationCountByDoctor(Long doctorId) {
        return conversationRepository.countByDoctorId(doctorId);
    }

    public void deleteConversation(Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc trò chuyện với ID: " + conversationId));
        
        // Delete all messages first
        List<MessageDTO.Response> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversationId)
                .stream()
                .map(msg -> {
                    MessageDTO.Response response = new MessageDTO.Response();
                    response.setMessageId(msg.getMessageId());
                    return response;
                })
                .toList();
        
        // Delete messages
        messageRepository.deleteAllById(messages.stream().map(MessageDTO.Response::getMessageId).toList());
        
        // Delete conversation
        conversationRepository.delete(conversation);
    }

    @Transactional(readOnly = true)
    public ConversationDTO.Response getConversationWithLatestMessages(Long conversationId, int limit) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc trò chuyện với ID: " + conversationId));
        
        // Get latest messages
        List<MessageDTO.Response> latestMessages = messageRepository
                .findByConversationIdOrderBySentAtDesc(conversationId)
                .stream()
                .limit(limit)
                .map(msg -> {
                    MessageDTO.Response response = new MessageDTO.Response();
                    response.setMessageId(msg.getMessageId());
                    response.setConversationId(msg.getConversation().getConversationId());
                    response.setSenderId(msg.getSender().getId());
                    response.setSenderName(msg.getSender().getFirstName() + " " + msg.getSender().getLastName());
                    response.setContent(msg.getContent());
                    response.setSentAt(msg.getSentAt());
                    return response;
                })
                .toList();
        
        return conversationMapper.entityToResponseDTOWithMessages(conversation, latestMessages);
    }
}
