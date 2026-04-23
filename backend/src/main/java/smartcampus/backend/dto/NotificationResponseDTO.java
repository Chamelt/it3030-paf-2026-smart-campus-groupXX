package smartcampus.backend.dto;

import smartcampus.backend.entity.Notification;
import smartcampus.backend.enums.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponseDTO(
        UUID notificationId,
        NotificationType entityType,
        UUID entityId,
        String message,
        boolean isRead,
        LocalDateTime createdAt
) {
    public static NotificationResponseDTO from(Notification n) {
        return new NotificationResponseDTO(
                n.getNotificationId(),
                n.getEntityType(),
                n.getEntityId(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
