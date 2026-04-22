package smartcampus.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import smartcampus.backend.entity.Ticket;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.TicketCategory;
import smartcampus.backend.enums.TicketPriority;
import smartcampus.backend.enums.TicketStatus;

import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    List<Ticket> findByCreatedBy(User user);

    List<Ticket> findByAssignedTo(User technician);

    List<Ticket> findByStatus(TicketStatus status);

    List<Ticket> findByCategory(TicketCategory category);

    List<Ticket> findByPriority(TicketPriority priority);

    List<Ticket> findByAssignedToAndStatus(User technician, TicketStatus status);
}
