package com.example.backend.controller;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.SystemNotificationDTO;
import com.example.backend.service.SystemNotificationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST Controller cho SystemNotification entity
 * Cung cấp các API endpoints để quản lý thông báo hệ thống
 */
@RestController
@RequestMapping("/api/system-notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SystemNotificationController {

    private final SystemNotificationService systemNotificationService;

    /**
     * Tạo notification mới
     * POST /api/system-notifications
     */
    @PostMapping
    public ResponseEntity<SystemNotificationDTO.Response> createNotification(
            @Valid @RequestBody SystemNotificationDTO.Create dto) {
        SystemNotificationDTO.Response created = systemNotificationService.createNotification(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Lấy notification theo ID
     * GET /api/system-notifications/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<SystemNotificationDTO.Response> getNotificationById(@PathVariable Long id) {
        SystemNotificationDTO.Response notification = systemNotificationService.getNotificationById(id);
        return ResponseEntity.ok(notification);
    }

    /**
     * Lấy tất cả notifications
     * GET /api/system-notifications
     */
    @GetMapping
    public ResponseEntity<List<SystemNotificationDTO.Response>> getAllNotifications() {
        List<SystemNotificationDTO.Response> notifications = systemNotificationService.getAllNotifications();
        return ResponseEntity.ok(notifications);
    }

    /**
     * Lấy notifications với pagination
     * GET /api/system-notifications/paginated?page=0&size=10&sort=createdAt,desc
     */
    @GetMapping("/paginated")
    public ResponseEntity<SystemNotificationDTO.ListResponse> getNotificationsPaginated(Pageable pageable) {
        SystemNotificationDTO.ListResponse response = systemNotificationService.getNotificationsPaginated(pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy notifications theo appointment
     * GET /api/system-notifications/by-appointment?appointmentId={id}
     */
    @GetMapping("/by-appointment")
    public ResponseEntity<List<SystemNotificationDTO.Response>> getNotificationsByAppointment(
            @RequestParam Long appointmentId) {
        List<SystemNotificationDTO.Response> notifications = 
                systemNotificationService.getNotificationsByAppointment(appointmentId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Lấy notifications hệ thống (không liên quan appointment)
     * GET /api/system-notifications/system
     */
    @GetMapping("/system")
    public ResponseEntity<List<SystemNotificationDTO.Response>> getSystemNotifications() {
        List<SystemNotificationDTO.Response> notifications = systemNotificationService.getSystemNotifications();
        return ResponseEntity.ok(notifications);
    }

    /**
     * Tìm kiếm notifications
     * GET /api/system-notifications/search?keyword={keyword}&startDate={date}&endDate={date}&systemOnly=true
     */
    @GetMapping("/search")
    public ResponseEntity<List<SystemNotificationDTO.Response>> searchNotifications(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long appointmentId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Boolean systemOnly) {
        
        SystemNotificationDTO.SearchRequest searchRequest = new SystemNotificationDTO.SearchRequest();
        searchRequest.setKeyword(keyword);
        searchRequest.setAppointmentId(appointmentId);
        searchRequest.setSystemOnly(systemOnly);
        
        // Parse dates if provided
        if (startDate != null && !startDate.trim().isEmpty()) {
            searchRequest.setStartDate(java.time.LocalDateTime.parse(startDate));
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            searchRequest.setEndDate(java.time.LocalDateTime.parse(endDate));
        }
        
        List<SystemNotificationDTO.Response> notifications = systemNotificationService.searchNotifications(searchRequest);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Cập nhật notification
     * PUT /api/system-notifications/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<SystemNotificationDTO.Response> updateNotification(
            @PathVariable Long id,
            @Valid @RequestBody SystemNotificationDTO.Update dto) {
        SystemNotificationDTO.Response updated = systemNotificationService.updateNotification(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Xóa notification
     * DELETE /api/system-notifications/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        systemNotificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Xóa notifications cũ (cleanup)
     * DELETE /api/system-notifications/cleanup?daysOld={days}
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<Void> deleteOldNotifications(@RequestParam(defaultValue = "30") int daysOld) {
        systemNotificationService.deleteOldNotifications(daysOld);
        return ResponseEntity.noContent().build();
    }

    /**
     * Đếm số notifications theo appointment
     * GET /api/system-notifications/count/by-appointment?appointmentId={id}
     */
    @GetMapping("/count/by-appointment")
    public ResponseEntity<Long> countNotificationsByAppointment(@RequestParam Long appointmentId) {
        Long count = systemNotificationService.countNotificationsByAppointment(appointmentId);
        return ResponseEntity.ok(count);
    }

    /**
     * Đếm số notifications hệ thống
     * GET /api/system-notifications/count/system
     */
    @GetMapping("/count/system")
    public ResponseEntity<Long> countSystemNotifications() {
        Long count = systemNotificationService.countSystemNotifications();
        return ResponseEntity.ok(count);
    }

    /**
     * Tạo notification tự động cho appointment events
     * POST /api/system-notifications/appointment/{appointmentId}
     */
    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<SystemNotificationDTO.Response> createAppointmentNotification(
            @PathVariable Long appointmentId,
            @RequestBody SystemNotificationDTO.Create dto) {
        SystemNotificationDTO.Response created = systemNotificationService.createAppointmentNotification(
                appointmentId, dto.getTitle(), dto.getMessage());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Tạo notification hệ thống
     * POST /api/system-notifications/system
     */
    @PostMapping("/system")
    public ResponseEntity<SystemNotificationDTO.Response> createSystemNotification(
            @RequestBody SystemNotificationDTO.Create dto) {
        SystemNotificationDTO.Response created = systemNotificationService.createSystemNotification(
                dto.getTitle(), dto.getMessage());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
