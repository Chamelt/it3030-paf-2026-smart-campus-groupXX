package smartcampus.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignTicketRequest {

    @NotNull(message = "Technician ID is required")
    private UUID technicianId;
}
