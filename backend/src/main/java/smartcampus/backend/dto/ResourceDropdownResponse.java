package smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;
import smartcampus.backend.enums.ResourceStatus;
import smartcampus.backend.enums.ResourceType;

import java.util.UUID;

@Data
@Builder
public class ResourceDropdownResponse {

    private UUID resourceId;
    private String name;
    private ResourceType type;
    private String floor;
    private Integer capacity;
    private ResourceStatus status;
}
