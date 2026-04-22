package smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ResourceDropdownResponse {

    private UUID resourceId;
    private String name;
    private String type;
    private String floor;
    private Integer capacity;
    private String status;
}
