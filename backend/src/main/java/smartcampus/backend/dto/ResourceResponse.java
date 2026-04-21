package smartcampus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import smartcampus.backend.entity.Resource;
import smartcampus.backend.enums.ResourceStatus;
import smartcampus.backend.enums.ResourceType;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceResponse {

    private UUID resourceId;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String floor;
    private String locationDescription;
    private LocalTime availabilityStart;
    private LocalTime availabilityEnd;
    private ResourceStatus status;
    private List<String> features;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ResourceResponse fromEntity(Resource resource) {
        return ResourceResponse.builder()
                .resourceId(resource.getResourceId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .floor(resource.getFloor())
                .locationDescription(resource.getLocationDescription())
                .availabilityStart(resource.getAvailabilityStart())
                .availabilityEnd(resource.getAvailabilityEnd())
                .status(resource.getStatus())
                .features(resource.getFeatures())
                .imageUrl(resource.getImageUrl())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
}
