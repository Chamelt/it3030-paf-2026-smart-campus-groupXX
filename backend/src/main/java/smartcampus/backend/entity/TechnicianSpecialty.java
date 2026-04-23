package smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import smartcampus.backend.enums.TicketCategory;

import java.util.UUID;

/**
 * Maps a TECHNICIAN-role user to one or more repair specialties.
 * Enables smart filtering: when an admin assigns a ticket, only technicians
 * whose specialty matches the ticket's category are shown in the dropdown.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "technician_specialties",
    uniqueConstraints = @UniqueConstraint(columnNames = {"technician_id", "specialty"})
)
public class TechnicianSpecialty {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @Enumerated(EnumType.STRING)
    @Column(name = "specialty", nullable = false)
    private TicketCategory specialty;

    @Builder.Default
    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;
}
