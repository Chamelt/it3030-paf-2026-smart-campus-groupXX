package smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import smartcampus.backend.enums.TicketCategory;
import smartcampus.backend.enums.TicketPriority;

import java.util.UUID;

@Data
public class CreateTicketRequest {

    private UUID resourceId;
    private String resourceName;
    private String locationText;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Contact details are required")
    private String contactDetails;
}
