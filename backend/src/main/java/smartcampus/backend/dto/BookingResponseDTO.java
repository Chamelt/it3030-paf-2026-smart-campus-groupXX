package smartcampus.backend.dto;

import smartcampus.backend.enums.BookingStatus;
import smartcampus.backend.entity.Booking;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
public class BookingResponseDTO {

    private UUID bookingId;

    // Resource info
    private UUID resourceId;
    private String resourceName;
    private String resourceType;
    private String resourceFloor;
    private Integer resourceCapacity;

    // User info
    private UUID userId;
    private String userName;
    private String userEmail;

    // Booking details
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private Integer expectedAttendees;

    // Status
    private BookingStatus status;
    private Boolean isPriority;
    private String priorityReason;

    // Admin actions
    private String rejectionReason;
    private String cancellationReason;
    private String reviewedByName;
    private LocalDateTime reviewedAt;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookingResponseDTO from(Booking b) {
        return BookingResponseDTO.builder()
            .bookingId(b.getBookingId())
            .resourceId(b.getResource().getResourceId())
            .resourceName(b.getResource().getName())
            .resourceType(b.getResource().getType().name())
            .resourceFloor(b.getResource().getFloor())
            .resourceCapacity(b.getResource().getCapacity())
            .userId(b.getUser().getUserId())
            .userName(b.getUser().getName())
            .userEmail(b.getUser().getEmail())
            .bookingDate(b.getBookingDate())
            .startTime(b.getStartTime())
            .endTime(b.getEndTime())
            .purpose(b.getPurpose())
            .expectedAttendees(b.getExpectedAttendees())
            .status(b.getStatus())
            .isPriority(b.getIsPriority())
            .priorityReason(b.getPriorityReason())
            .rejectionReason(b.getRejectionReason())
            .cancellationReason(b.getCancellationReason())
            .reviewedByName(b.getReviewedBy() != null ? b.getReviewedBy().getName() : null)
            .reviewedAt(b.getReviewedAt())
            .createdAt(b.getCreatedAt())
            .updatedAt(b.getUpdatedAt())
            .build();
    }
}