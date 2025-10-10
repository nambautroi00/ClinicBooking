package com.example.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.ReviewDTO;
import com.example.backend.exception.NotFoundException;
import com.example.backend.exception.ConflictException;
import com.example.backend.mapper.ReviewMapper;
import com.example.backend.model.Review;
import com.example.backend.model.Doctor;
import com.example.backend.model.Patient;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ReviewMapper reviewMapper;

    @Transactional(readOnly = true)
    public List<ReviewDTO.Response> getAll() {
        List<Review> list = reviewRepository.findAll();
        return list.stream().map(reviewMapper::entityToResponseDTO).toList();
    }

    public ReviewDTO.Response create(ReviewDTO.Create dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với ID: " + dto.getPatientId()));
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bác sĩ với ID: " + dto.getDoctorId()));

        // Check if patient already reviewed this doctor
        List<Review> existingReviews = reviewRepository.findByPatient_PatientIdAndDoctor_DoctorId(
                dto.getPatientId(), dto.getDoctorId());
        if (!existingReviews.isEmpty()) {
            throw new ConflictException("Bệnh nhân đã đánh giá bác sĩ này rồi");
        }

        Review entity = reviewMapper.createDTOToEntity(dto, patient, doctor);
        Review saved = reviewRepository.save(entity);
        return reviewMapper.entityToResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public ReviewDTO.Response getById(Long reviewId) {
        Review entity = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));
        return reviewMapper.entityToResponseDTO(entity);
    }

    @Transactional(readOnly = true)
    public List<ReviewDTO.Response> getByPatient(Long patientId) {
        List<Review> list = reviewRepository.findByPatient_PatientId(patientId);
        return list.stream().map(reviewMapper::entityToResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewDTO.Response> getByDoctor(Long doctorId) {
        List<Review> list = reviewRepository.findByDoctor_DoctorId(doctorId);
        return list.stream().map(reviewMapper::entityToResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewDTO.Response> getActiveReviewsByDoctor(Long doctorId) {
        List<Review> list = reviewRepository.findActiveReviewsByDoctor(doctorId);
        return list.stream().map(reviewMapper::entityToResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public Double getAverageRatingByDoctor(Long doctorId) {
        return reviewRepository.getAverageRatingByDoctor(doctorId);
    }

    @Transactional(readOnly = true)
    public Long getReviewCountByDoctor(Long doctorId) {
        return reviewRepository.getReviewCountByDoctor(doctorId);
    }

    public ReviewDTO.Response update(Long reviewId, ReviewDTO.Update dto) {
        Review entity = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));
        reviewMapper.applyUpdateToEntity(entity, dto);
        Review saved = reviewRepository.save(entity);
        return reviewMapper.entityToResponseDTO(saved);
    }

    public void delete(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new NotFoundException("Không tìm thấy đánh giá với ID: " + reviewId);
        }
        reviewRepository.deleteById(reviewId);
    }

    public ReviewDTO.Response deactivateReview(Long reviewId) {
        Review entity = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));
        
        entity.setStatus("INACTIVE");
        Review saved = reviewRepository.save(entity);
        return reviewMapper.entityToResponseDTO(saved);
    }
}

