package smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "pref_id", updatable = false, nullable = false)
    private UUID prefId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(name = "booking_approved", nullable = false)
    private boolean bookingApproved = true;

    @Builder.Default
    @Column(name = "booking_rejected", nullable = false)
    private boolean bookingRejected = true;

    @Builder.Default
    @Column(name = "booking_cancelled", nullable = false)
    private boolean bookingCancelled = true;

    @Builder.Default
    @Column(name = "ticket_status_change", nullable = false)
    private boolean ticketStatusChange = true;

    @Builder.Default
    @Column(name = "ticket_comment", nullable = false)
    private boolean ticketComment = true;

    @Builder.Default
    @Column(name = "ticket_assigned", nullable = false)
    private boolean ticketAssigned = true;
}
