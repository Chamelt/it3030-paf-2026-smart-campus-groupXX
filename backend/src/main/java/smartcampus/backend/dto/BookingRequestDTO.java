package smartcampus.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class BookingRequestDTO {

    @NotNull(message = "resourceId is required")
    private UUID resourceId;

    @NotNull(message = "date is required")
    private LocalDate date;

    @NotNull(message = "startTime is required")
    private LocalTime startTime;

    @NotNull(message = "endTime is required")
    private LocalTime endTime;

    @NotBlank(message = "purpose is required")
    @Size(max = 500, message = "purpose must not exceed 500 characters")
    private String purpose;

    @Min(value = 1, message = "expectedAttendees must be at least 1")
    private Integer expectedAttendees;

    private Boolean isPriority = false;

    @Size(max = 500, message = "priorityReason must not exceed 500 characters")
    private String priorityReason;
}