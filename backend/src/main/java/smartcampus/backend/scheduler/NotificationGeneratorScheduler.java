package smartcampus.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import smartcampus.backend.entity.Booking;
import smartcampus.backend.entity.Ticket;
import smartcampus.backend.entity.TicketComment;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.BookingStatus;
import smartcampus.backend.enums.NotificationType;
import smartcampus.backend.enums.TicketStatus;
import smartcampus.backend.enums.UserRole;
import smartcampus.backend.repository.BookingRepository;
import smartcampus.backend.repository.TicketCommentRepository;
import smartcampus.backend.repository.TicketRepository;
import smartcampus.backend.repository.UserRepository;
import smartcampus.backend.service.NotificationService;

import java.util.List;
import java.util.UUID;

/**
 * Polling-based notification generator.
 *
 * Runs every 5 seconds and scans bookings, tickets, and comments for state
 * changes that have not yet been notified. The notifKey on each Notification
 * row acts as an idempotency guard — each logical event is notified exactly
 * once regardless of how many times the scheduler fires.
 *
 * This design deliberately avoids modifying BookingService or TicketService,
 * satisfying the requirement that Module D adds notifications without altering
 * any existing module code.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationGeneratorScheduler {

    private final BookingRepository       bookingRepository;
    private final TicketRepository        ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final UserRepository          userRepository;
    private final NotificationService     notificationService;

    // ────────────────────────────────────────────────────────────────────────
    // BOOKING NOTIFICATIONS
    //   PENDING   → each ADMIN receives a "new booking request" alert
    //   APPROVED  → requester receives an approval confirmation
    //   REJECTED  → requester receives a rejection notice with reason
    //   CANCELLED → requester receives a cancellation notice
    // ────────────────────────────────────────────────────────────────────────
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void generateBookingNotifications() {
        List<User> admins = userRepository.findAllByRole(UserRole.ADMIN);

        // PENDING → notify every admin
        List<Booking> pending = bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.PENDING);
        for (Booking b : pending) {
            String resource = b.getResource().getName();
            String requester = b.getUser().getName();
            for (User admin : admins) {
                String key = "BOOKING_PENDING_" + b.getBookingId() + "_ADMIN_" + admin.getUserId();
                notificationService.createIfAbsent(
                        key, admin.getUserId(),
                        NotificationType.BOOKING, b.getBookingId(),
                        "New booking request from " + requester + " for " + resource
                                + " on " + b.getBookingDate() + ".",
                        null);
            }
        }

        // IN_REVIEW → notify every admin (booking is being actively reviewed)
        List<Booking> inReview = bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.IN_REVIEW);
        for (Booking b : inReview) {
            String resource = b.getResource().getName();
            for (User admin : admins) {
                String key = "BOOKING_IN_REVIEW_" + b.getBookingId() + "_ADMIN_" + admin.getUserId();
                notificationService.createIfAbsent(
                        key, admin.getUserId(),
                        NotificationType.BOOKING, b.getBookingId(),
                        "Booking for " + resource + " on " + b.getBookingDate()
                                + " is now under review.",
                        null);
            }
        }

        // APPROVED → notify requester
        List<Booking> approved = bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.APPROVED);
        for (Booking b : approved) {
            String key = "BOOKING_APPROVED_" + b.getBookingId();
            notificationService.createIfAbsent(
                    key, b.getUser().getUserId(),
                    NotificationType.BOOKING, b.getBookingId(),
                    "Your booking for " + b.getResource().getName()
                            + " on " + b.getBookingDate() + " has been approved.",
                    "bookingApproved");
        }

        // REJECTED → notify requester with reason
        List<Booking> rejected = bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.REJECTED);
        for (Booking b : rejected) {
            String key = "BOOKING_REJECTED_" + b.getBookingId();
            String reason = b.getRejectionReason() != null
                    ? " Reason: " + b.getRejectionReason() : "";
            notificationService.createIfAbsent(
                    key, b.getUser().getUserId(),
                    NotificationType.BOOKING, b.getBookingId(),
                    "Your booking for " + b.getResource().getName()
                            + " on " + b.getBookingDate() + " was rejected." + reason,
                    "bookingRejected");
        }

        // CANCELLED → notify requester
        List<Booking> cancelled = bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.CANCELLED);
        for (Booking b : cancelled) {
            String key = "BOOKING_CANCELLED_" + b.getBookingId();
            notificationService.createIfAbsent(
                    key, b.getUser().getUserId(),
                    NotificationType.BOOKING, b.getBookingId(),
                    "Your booking for " + b.getResource().getName()
                            + " on " + b.getBookingDate() + " has been cancelled.",
                    "bookingCancelled");
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // TICKET NOTIFICATIONS
    //   OPEN        → each ADMIN receives a new incident alert
    //   ASSIGNED    → assigned technician is notified
    //   IN_PROGRESS,
    //   RESOLVED,
    //   CLOSED,
    //   REJECTED    → ticket creator is notified of the status change
    // ────────────────────────────────────────────────────────────────────────
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void generateTicketNotifications() {
        List<User> admins = userRepository.findAllByRole(UserRole.ADMIN);
        List<Ticket> allTickets = ticketRepository.findAll();

        for (Ticket t : allTickets) {
            String location = resolveLocation(t);

            // OPEN → notify all admins
            if (t.getStatus() == TicketStatus.OPEN) {
                for (User admin : admins) {
                    String key = "TICKET_OPEN_" + t.getTicketId() + "_ADMIN_" + admin.getUserId();
                    notificationService.createIfAbsent(
                            key, admin.getUserId(),
                            NotificationType.TICKET, t.getTicketId(),
                            "New incident ticket: " + t.getCategory() + " at " + location
                                    + " – Priority: " + t.getPriority() + ".",
                            null);
                }
            }

            // ASSIGNED / IN_PROGRESS → notify the assigned technician once
            if (t.getAssignedTo() != null &&
                    (t.getStatus() == TicketStatus.ASSIGNED || t.getStatus() == TicketStatus.IN_PROGRESS)) {
                String key = "TICKET_ASSIGNED_" + t.getTicketId();
                String desc = t.getDescription().length() > 60
                        ? t.getDescription().substring(0, 60) + "…"
                        : t.getDescription();
                notificationService.createIfAbsent(
                        key, t.getAssignedTo().getUserId(),
                        NotificationType.TICKET, t.getTicketId(),
                        "You have been assigned to ticket #" + t.getTicketId() + ": " + desc,
                        "ticketAssigned");
            }

            // Status change → notify the ticket creator
            if (t.getStatus() == TicketStatus.IN_PROGRESS ||
                    t.getStatus() == TicketStatus.RESOLVED  ||
                    t.getStatus() == TicketStatus.CLOSED    ||
                    t.getStatus() == TicketStatus.REJECTED) {

                String key = "TICKET_STATUS_" + t.getTicketId() + "_" + t.getStatus();
                String extra = "";
                if (t.getStatus() == TicketStatus.REJECTED && t.getRejectionReason() != null) {
                    extra = " Reason: " + t.getRejectionReason();
                }
                if (t.getStatus() == TicketStatus.RESOLVED && t.getResolutionNotes() != null) {
                    extra = " Notes: " + t.getResolutionNotes();
                }

                notificationService.createIfAbsent(
                        key, t.getCreatedBy().getUserId(),
                        NotificationType.TICKET, t.getTicketId(),
                        "Ticket #" + t.getTicketId() + " status updated to " + t.getStatus() + "." + extra,
                        "ticketStatusChange");
            }
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // COMMENT NOTIFICATIONS
    // When a comment is added to a ticket:
    //   → notify the ticket creator  (unless they wrote the comment)
    //   → notify the assigned tech   (unless they wrote the comment)
    // ────────────────────────────────────────────────────────────────────────
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void generateCommentNotifications() {
        List<TicketComment> allComments = commentRepository.findAll();

        for (TicketComment c : allComments) {
            if (Boolean.TRUE.equals(c.getIsDeleted())) continue;

            Ticket  t          = c.getTicket();
            UUID    authorId   = c.getAuthor().getUserId();
            String  commenter  = c.getAuthor().getName();
            String  msg        = "New comment on ticket #" + t.getTicketId()
                    + " from " + commenter + ".";

            // Notify ticket creator
            UUID creatorId = t.getCreatedBy().getUserId();
            if (!creatorId.equals(authorId)) {
                String key = "COMMENT_" + c.getCommentId() + "_CREATOR_" + creatorId;
                notificationService.createIfAbsent(
                        key, creatorId,
                        NotificationType.COMMENT, t.getTicketId(),
                        msg, "ticketComment");
            }

            // Notify assigned technician (if different from author and creator)
            if (t.getAssignedTo() != null) {
                UUID techId = t.getAssignedTo().getUserId();
                if (!techId.equals(authorId) && !techId.equals(creatorId)) {
                    String key = "COMMENT_" + c.getCommentId() + "_TECH_" + techId;
                    notificationService.createIfAbsent(
                            key, techId,
                            NotificationType.COMMENT, t.getTicketId(),
                            msg, "ticketComment");
                }
            }
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    private String resolveLocation(Ticket t) {
        if (t.getResourceName() != null && !t.getResourceName().isBlank()) return t.getResourceName();
        if (t.getLocationText()  != null && !t.getLocationText().isBlank())  return t.getLocationText();
        return "unknown location";
    }
}
