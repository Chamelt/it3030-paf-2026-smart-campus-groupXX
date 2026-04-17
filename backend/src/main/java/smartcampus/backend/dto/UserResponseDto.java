package smartcampus.backend.dto;

import smartcampus.backend.entity.User;
import smartcampus.backend.enums.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponseDto(
        UUID userId,
        String email,
        String name,
        String profilePictureUrl,
        UserRole role,
        boolean active,
        LocalDateTime createdAt
) {
    public static UserResponseDto from(User user) {
        return new UserResponseDto(
                user.getUserId(),
                user.getEmail(),
                user.getName(),
                user.getProfilePictureUrl(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
