package smartcampus.backend.dto;

public record AuthResponseDto(
        String token,
        String tokenType,
        UserResponseDto user
) {
    public static AuthResponseDto of(String token, UserResponseDto user) {
        return new AuthResponseDto(token, "Bearer", user);
    }
}
