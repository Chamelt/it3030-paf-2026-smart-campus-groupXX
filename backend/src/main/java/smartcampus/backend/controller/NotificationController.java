package smartcampus.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import smartcampus.backend.dto.BroadcastRequestDTO;
import smartcampus.backend.dto.NotificationPreferencesDTO;
import smartcampus.backend.dto.NotificationResponseDTO;
import smartcampus.backend.entity.User;
import smartcampus.backend.service.NotificationService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

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
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getNotifications(user.getUserId()));
    }

    // ─── GET /api/notifications/unread-count ─────────────────────────────────
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal User user) {
        long count = notificationService.getUnreadCount(user.getUserId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    // ─── PATCH /api/notifications/{id}/read ──────────────────────────────────
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationResponseDTO> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.markAsRead(id, user.getUserId()));
    }

    // ─── PATCH /api/notifications/read-all ───────────────────────────────────
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getUserId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }

    // ─── DELETE /api/notifications/{id} ──────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        notificationService.deleteNotification(id, user.getUserId());
        return ResponseEntity.noContent().build();
    }

    // ─── GET /api/notifications/preferences ──────────────────────────────────
    @GetMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationPreferencesDTO> getPreferences(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getPreferences(user.getUserId()));
    }

    // ─── PUT /api/notifications/preferences ──────────────────────────────────
    @PutMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationPreferencesDTO> updatePreferences(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody NotificationPreferencesDTO dto) {
        return ResponseEntity.ok(notificationService.updatePreferences(user.getUserId(), dto));
    }

    // ─── POST /api/notifications/broadcast ───────────────────────────────────
    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> broadcast(
            @Valid @RequestBody BroadcastRequestDTO dto,
            @AuthenticationPrincipal User user) {
        int notified = notificationService.broadcast(dto, user.getUserId());
        return ResponseEntity.ok(Map.of(
                "message", "Broadcast sent successfully.",
                "usersNotified", notified
        ));
    }

    // ─── POST /api/notifications/broadcast/admins ─────────────────────────────
    @PostMapping("/broadcast/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> broadcastToAdmins(
            @Valid @RequestBody BroadcastRequestDTO dto,
            @AuthenticationPrincipal User user) {
        int notified = notificationService.broadcastToAdmins(dto, user.getUserId());
        return ResponseEntity.ok(Map.of(
                "message", "Admin broadcast sent successfully.",
                "adminsNotified", notified
        ));
    }
}
