package smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import smartcampus.backend.enums.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "notifications",
    indexes = @Index(name = "idx_notif_user_created", columnList = "user_id, created_at DESC")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notification_id", updatable = false, nullable = false)
    private UUID notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 20)
    private NotificationType entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    /**
     * Idempotency key that prevents the polling scheduler from creating
     * duplicate notifications. Pattern: "{EVENT}_{entityId}[_{qualifier}]"
     */
    @Column(name = "notif_key", unique = true, length = 255)
    private String notifKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
