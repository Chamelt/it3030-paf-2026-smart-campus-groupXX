package smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ResourceBookingsDTO {
    private UUID resourceId;
    private String resourceName;
    private String resourceType;
    private String resourceFloor;
    private Integer resourceCapacity;
    private List<BookingResponseDTO> bookings;
}