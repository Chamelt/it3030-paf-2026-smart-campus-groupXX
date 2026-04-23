package smartcampus.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import smartcampus.backend.enums.TicketStatus;

@Data
public class UpdateTicketStatusRequest {

    @NotNull(message = "Status is required")
    private TicketStatus status;

    private String resolutionNotes;
    private String rejectionReason;
}
