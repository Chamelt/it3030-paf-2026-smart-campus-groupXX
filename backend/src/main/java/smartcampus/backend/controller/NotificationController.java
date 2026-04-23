package smartcampus.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smartcampus.backend.dto.BroadcastRequestDTO;
import smartcampus.backend.dto.NotificationPreferencesDTO;
import smartcampus.backend.dto.NotificationResponseDTO;
import smartcampus.backend.service.NotificationService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Module D – Notifications REST API
 *
 * GET    /api/notifications                    – list own notifications (newest first)
 * GET    /api/notifications/unread-count       – unread badge count        [INNOVATION]
 * PATCH  /api/notifications/{id}/read          – mark single as read
 * PATCH  /api/notifications/read-all           – mark all as read
 * DELETE /api/notifications/{id}               – delete a notification
 * GET    /api/notifications/preferences        – get notification preferences
 * PUT    /api/notifications/preferences        – update notification preferences
 * POST   /api/notifications/broadcast          – admin: broadcast to all   [INNOVATION]
 * POST   /api/notifications/broadcast/admins   – admin: broadcast to admins[INNOVATION]
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    // ─── GET /api/notifications ───────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationResponseDTO>> getNotifications(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    // ─── GET /api/notifications/unread-count  (INNOVATION) ───────────────────
    // Lightweight endpoint for the frontend bell-icon badge.
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("X-User-Id") UUID userId) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    // ─── PATCH /api/notifications/{id}/read ──────────────────────────────────
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationResponseDTO> markAsRead(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(notificationService.markAsRead(id, userId));
    }

    // ─── PATCH /api/notifications/read-all ───────────────────────────────────
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @RequestHeader("X-User-Id") UUID userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }

    // ─── DELETE /api/notifications/{id} ──────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId) {
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ─── GET /api/notifications/preferences ──────────────────────────────────
    @GetMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationPreferencesDTO> getPreferences(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(notificationService.getPreferences(userId));
    }

    // ─── PUT /api/notifications/preferences ──────────────────────────────────
    @PutMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationPreferencesDTO> updatePreferences(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody NotificationPreferencesDTO dto) {
        return ResponseEntity.ok(notificationService.updatePreferences(userId, dto));
    }

    // ─── POST /api/notifications/broadcast  (INNOVATION) ─────────────────────
    // Admin sends a system-wide message to every user.
    // Returns the number of users notified.
    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> broadcast(
            @Valid @RequestBody BroadcastRequestDTO dto,
            @RequestHeader("X-User-Id") UUID adminId) {
        int notified = notificationService.broadcast(dto, adminId);
        return ResponseEntity.ok(Map.of(
                "message", "Broadcast sent successfully.",
                "usersNotified", notified
        ));
    }

    // ─── POST /api/notifications/broadcast/admins  (INNOVATION) ──────────────
    // Admin sends a notice only to other admin users.
    @PostMapping("/broadcast/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> broadcastToAdmins(
            @Valid @RequestBody BroadcastRequestDTO dto,
            @RequestHeader("X-User-Id") UUID adminId) {
        int notified = notificationService.broadcastToAdmins(dto, adminId);
        return ResponseEntity.ok(Map.of(
                "message", "Admin broadcast sent successfully.",
                "adminsNotified", notified
        ));
    }
}
