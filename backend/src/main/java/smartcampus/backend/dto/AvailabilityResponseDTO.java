package smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AvailabilityResponseDTO {
    private Boolean available;
    private String message;
}