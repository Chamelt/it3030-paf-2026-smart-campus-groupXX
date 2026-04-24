package smartcampus.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import smartcampus.backend.dto.BroadcastRequestDTO;
import smartcampus.backend.dto.NotificationPreferencesDTO;
import smartcampus.backend.dto.NotificationResponseDTO;
import smartcampus.backend.entity.Notification;
import smartcampus.backend.entity.NotificationPreference;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.NotificationType;
import smartcampus.backend.enums.UserRole;
import smartcampus.backend.exception.ResourceNotFoundException;
import smartcampus.backend.repository.NotificationPreferenceRepository;
import smartcampus.backend.repository.NotificationRepository;
import smartcampus.backend.repository.UserRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    // ─── GET /api/notifications ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getNotifications(UUID userId) {
        return notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponseDTO::from)
                .collect(Collectors.toList());
    }

    // ─── GET /api/notifications/unread-count  (innovation) ───────────────────
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUser_UserIdAndIsReadFalse(userId);
    }

    // ─── PATCH /api/notifications/{id}/read ──────────────────────────────────
    @Transactional
    public NotificationResponseDTO markAsRead(UUID notificationId, UUID userId) {
        Notification notif = findOwnedOrThrow(notificationId, userId);
        notif.setRead(true);
        return NotificationResponseDTO.from(notificationRepository.save(notif));
    }

    // ─── PATCH /api/notifications/read-all ───────────────────────────────────
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
        log.debug("Marked all notifications as read for user {}", userId);
    }

    // ─── DELETE /api/notifications/{id} ──────────────────────────────────────
    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notification notif = findOwnedOrThrow(notificationId, userId);
        notificationRepository.delete(notif);
    }

    // ─── GET /api/notifications/preferences ──────────────────────────────────
    @Transactional(readOnly = true)
    public NotificationPreferencesDTO getPreferences(UUID userId) {
        return preferenceRepository.findByUser_UserId(userId)
                .map(this::toPreferencesDTO)
                .orElseGet(() -> new NotificationPreferencesDTO(true, true, true, true, true, true));
    }

    // ─── PUT /api/notifications/preferences ──────────────────────────────────
    @Transactional
    public NotificationPreferencesDTO updatePreferences(UUID userId, NotificationPreferencesDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        NotificationPreference pref = preferenceRepository.findByUser_UserId(userId)
                .orElseGet(() -> NotificationPreference.builder().user(user).build());

        pref.setBookingApproved(dto.bookingApproved());
        pref.setBookingRejected(dto.bookingRejected());
        pref.setBookingCancelled(dto.bookingCancelled());
        pref.setTicketStatusChange(dto.ticketStatusChange());
        pref.setTicketComment(dto.ticketComment());
        pref.setTicketAssigned(dto.ticketAssigned());

        return toPreferencesDTO(preferenceRepository.save(pref));
    }

    // ─── POST /api/notifications/broadcast  (INNOVATION) ─────────────────────
    // Admin sends a system-wide message to every active user.
    @Transactional
    public int broadcast(BroadcastRequestDTO dto, UUID adminId) {
        List<User> allUsers = userRepository.findAll();
        String prefix = "[Broadcast] ";
        int count = 0;

        for (User user : allUsers) {
            // Use nano-time to guarantee a unique key per user per broadcast
            String key = "BROADCAST_" + adminId + "_" + System.nanoTime() + "_" + user.getUserId();
            Notification notif = Notification.builder()
                    .user(user)
                    .entityType(NotificationType.SYSTEM)
                    .message(prefix + dto.message())
                    .notifKey(key)
                    .build();
            notificationRepository.save(notif);
            count++;
        }

        log.info("Admin {} broadcast message to {} users: \"{}\"", adminId, count, dto.message());
        return count;
    }

    // ─── POST /api/notifications/broadcast/admins  (INNOVATION) ──────────────
    // Admin sends a message to only other admin users.
    @Transactional
    public int broadcastToAdmins(BroadcastRequestDTO dto, UUID sendingAdminId) {
        List<User> admins = userRepository.findAllByRole(UserRole.ADMIN);
        String prefix = "[Admin Notice] ";
        int count = 0;

        for (User admin : admins) {
            String key = "BROADCAST_ADMINS_" + sendingAdminId + "_" + System.nanoTime() + "_" + admin.getUserId();
            Notification notif = Notification.builder()
                    .user(admin)
                    .entityType(NotificationType.SYSTEM)
                    .message(prefix + dto.message())
                    .notifKey(key)
                    .build();
            notificationRepository.save(notif);
            count++;
        }
        return count;
    }

    // ─── Internal: idempotent create, called by the scheduler ────────────────
    // Uses REQUIRES_NEW so each notification is committed in its own
    // transaction — a failure on one key does not roll back others.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createIfAbsent(String notifKey, UUID userId,
                               NotificationType entityType, UUID entityId,
                               String message, String prefField) {

        if (notificationRepository.existsByNotifKey(notifKey)) return;

        if (prefField != null) {
            Optional<NotificationPreference> pref = preferenceRepository.findByUser_UserId(userId);
            if (pref.isPresent() && !isPreferenceEnabled(pref.get(), prefField)) {
                log.debug("Notification suppressed by preference: key={}", notifKey);
                return;
            }
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("createIfAbsent: user {} not found, skipping", userId);
            return;
        }

        try {
            notificationRepository.save(
                    Notification.builder()
                            .user(user)
                            .entityType(entityType)
                            .entityId(entityId)
                            .message(message)
                            .notifKey(notifKey)
                            .build()
            );
            log.debug("Notification created: key={}", notifKey);
        } catch (DataIntegrityViolationException e) {
            // Race condition: another scheduler run inserted the same key first — safe to ignore
            log.debug("Notification key {} already inserted by concurrent run, skipping", notifKey);
        }
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private Notification findOwnedOrThrow(UUID notificationId, UUID userId) {
        Notification notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        if (!notif.getUser().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Notification not found: " + notificationId);
        }
        return notif;
    }

    private NotificationPreferencesDTO toPreferencesDTO(NotificationPreference p) {
        return new NotificationPreferencesDTO(
                p.isBookingApproved(), p.isBookingRejected(), p.isBookingCancelled(),
                p.isTicketStatusChange(), p.isTicketComment(), p.isTicketAssigned()
        );
    }

    private boolean isPreferenceEnabled(NotificationPreference pref, String field) {
        return switch (field) {
            case "bookingApproved"    -> pref.isBookingApproved();
            case "bookingRejected"    -> pref.isBookingRejected();
            case "bookingCancelled"   -> pref.isBookingCancelled();
            case "ticketStatusChange" -> pref.isTicketStatusChange();
            case "ticketComment"      -> pref.isTicketComment();
            case "ticketAssigned"     -> pref.isTicketAssigned();
            default -> true;
        };
    }
}
