package smartcampus.backend.dto;

public record NotificationPreferencesDTO(
        boolean bookingApproved,
        boolean bookingRejected,
        boolean bookingCancelled,
        boolean ticketStatusChange,
        boolean ticketComment,
        boolean ticketAssigned
) {}
