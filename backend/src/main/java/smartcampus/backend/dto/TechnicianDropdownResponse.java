package smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TechnicianDropdownResponse {

    private UUID userId;
    private String name;
    private String email;
    private boolean isAvailable;
    private String specialty;
}
