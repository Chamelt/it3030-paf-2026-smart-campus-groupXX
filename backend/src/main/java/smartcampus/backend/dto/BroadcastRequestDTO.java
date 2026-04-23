package smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BroadcastRequestDTO(
        @NotBlank(message = "Broadcast message cannot be blank")
        @Size(max = 500, message = "Message must be 500 characters or less")
        String message
) {}
