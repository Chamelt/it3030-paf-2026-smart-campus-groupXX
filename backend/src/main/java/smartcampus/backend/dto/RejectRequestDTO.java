package smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectRequestDTO {

    @NotBlank(message = "reason is required when rejecting a booking")
    private String reason;
}