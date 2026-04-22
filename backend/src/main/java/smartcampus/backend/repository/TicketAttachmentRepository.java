package smartcampus.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import smartcampus.backend.entity.Ticket;
import smartcampus.backend.entity.TicketAttachment;

import java.util.List;
import java.util.UUID;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, UUID> {

    List<TicketAttachment> findByTicket(Ticket ticket);

    long countByTicket(Ticket ticket);
}
