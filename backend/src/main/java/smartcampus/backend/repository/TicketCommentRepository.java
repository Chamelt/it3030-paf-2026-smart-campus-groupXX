package smartcampus.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import smartcampus.backend.entity.Ticket;
import smartcampus.backend.entity.TicketComment;

import java.util.List;
import java.util.UUID;

public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {

    List<TicketComment> findByTicketAndIsDeletedFalseOrderByCreatedAtAsc(Ticket ticket);
}
