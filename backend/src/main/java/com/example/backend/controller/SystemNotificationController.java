package com.example.backend.controller;

import com.example.backend.model.SystemNotification;
import com.example.backend.service.SystemNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class SystemNotificationController {

    private final SystemNotificationService notificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> listByUser(@PathVariable Long userId,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "50") int size) {
        Page<SystemNotification> data = notificationService.listByUser(userId, page, size);
        long unread = notificationService.unreadCount(userId);
        Map<String, Object> body = new HashMap<>();
        body.put("content", data.getContent());
        body.put("totalElements", data.getTotalElements());
        body.put("totalPages", data.getTotalPages());
        body.put("unreadCount", unread);
        return ResponseEntity.ok(body);
    }

    @PostMapping
    public ResponseEntity<SystemNotification> create(@RequestBody CreateRequest req) {
        SystemNotification n = notificationService.create(req.userId, req.title, req.message, req.type);
        return ResponseEntity.ok(n);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<SystemNotification> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markRead(id));
    }

    @PostMapping("/user/{userId}/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead(@PathVariable Long userId) {
        int updated = notificationService.markAllRead(userId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("updated", updated);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/events/register-success")
    public ResponseEntity<SystemNotification> registerSuccess(@RequestParam Long userId) {
        return ResponseEntity.ok(notificationService.createRegisterSuccess(userId));
    }

    @PostMapping("/events/booking-created")
    public ResponseEntity<SystemNotification> bookingCreated(@RequestParam Long userId,
                                                             @RequestParam Long appointmentId) {
        return ResponseEntity.ok(notificationService.createBookingCreated(userId, appointmentId));
    }

    @PostMapping("/events/booking-cancelled")
    public ResponseEntity<SystemNotification> bookingCancelled(@RequestParam Long userId,
                                                               @RequestParam Long appointmentId) {
        return ResponseEntity.ok(notificationService.createBookingCancelled(userId, appointmentId));
    }

    @PostMapping("/events/reminder")
    public ResponseEntity<SystemNotification> reminder(@RequestParam Long userId,
                                                       @RequestParam Long appointmentId,
                                                       @RequestParam(required = false) String when) {
        return ResponseEntity.ok(notificationService.createReminder(userId, appointmentId, when));
    }

    public static class CreateRequest {
        public Long userId;
        public String title;
        public String message;
        public String type;
    }
}
