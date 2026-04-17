package smartcampus.backend.dto;

import jakarta.validation.constraints.NotNull;
import smartcampus.backend.enums.UserRole;

public record RoleUpdateRequest(
        @NotNull(message = "Role must not be null")
        UserRole role
) {}
