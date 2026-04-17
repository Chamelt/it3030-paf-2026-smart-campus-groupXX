// Feature branch: feature/E-user-entity-repository
// Business logic for user operations:
//   getMyProfile    — returns the currently authenticated user's profile
//   getAllUsers     — ADMIN only; returns all registered users
//   updateUserRole  — ADMIN only; changes a user's role (USER / ADMIN / TECHNICIAN)
package smartcampus.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smartcampus.backend.dto.RoleUpdateRequest;
import smartcampus.backend.dto.UserResponseDto;
import smartcampus.backend.entity.User;
import smartcampus.backend.exception.ResourceNotFoundException;
import smartcampus.backend.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponseDto getMyProfile(User currentUser) {
        return UserResponseDto.from(currentUser);
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponseDto::from)
                .toList();
    }

    @Transactional
    public UserResponseDto updateUserRole(UUID userId, RoleUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setRole(request.role());
        return UserResponseDto.from(userRepository.save(user));
    }

    public User findById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
}
