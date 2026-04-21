package smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import smartcampus.backend.enums.ResourceType;

import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateResourceRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    @Positive
    private Integer capacity;

    @NotBlank(message = "Floor is required")
    private String floor;

    @NotBlank(message = "Location description is required")
    private String locationDescription;

    @NotNull(message = "Availability start is required")
    private LocalTime availabilityStart;

    @NotNull(message = "Availability end is required")
    private LocalTime availabilityEnd;

    private List<String> features;
}
