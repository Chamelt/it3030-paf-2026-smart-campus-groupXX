// Feature branch: feature/E-user-entity-repository
// Business logic for user operations:
//   getMyProfile    — returns the currently authenticated user's profile
//   getAllUsers     — ADMIN only; returns all registered users
//   updateUserRole  — ADMIN only; changes a user's role (USER / ADMIN / TECHNICIAN)
package smartcampus.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smartcampus.backend.dto.RoleUpdateRequest;
import smartcampus.backend.dto.SpecialtyUpdateRequest;
import smartcampus.backend.dto.UserResponseDto;
import smartcampus.backend.entity.TechnicianSpecialty;
import smartcampus.backend.entity.User;
import smartcampus.backend.exception.ResourceNotFoundException;
import smartcampus.backend.repository.TechnicianSpecialtyRepository;
import smartcampus.backend.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final TechnicianSpecialtyRepository technicianSpecialtyRepository;

    public UserService(UserRepository userRepository,
                       TechnicianSpecialtyRepository technicianSpecialtyRepository) {
        this.userRepository = userRepository;
        this.technicianSpecialtyRepository = technicianSpecialtyRepository;
    }

    public UserResponseDto getMyProfile(User currentUser) {
        return UserResponseDto.from(currentUser);
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(u -> {
                    String specialty = null;
                    List<TechnicianSpecialty> specs = technicianSpecialtyRepository.findByTechnician(u);
                    if (!specs.isEmpty()) specialty = specs.get(0).getSpecialty().name();
                    return UserResponseDto.from(u, specialty);
                })
                .toList();
    }

    @Transactional
    public UserResponseDto updateUserRole(UUID userId, RoleUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setRole(request.role());
        User saved = userRepository.save(user);
        List<TechnicianSpecialty> specs = technicianSpecialtyRepository.findByTechnician(saved);
        String specialty = specs.isEmpty() ? null : specs.get(0).getSpecialty().name();
        return UserResponseDto.from(saved, specialty);
    }

    @Transactional
    public UserResponseDto updateTechnicianSpecialty(UUID userId, SpecialtyUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        List<TechnicianSpecialty> existing = technicianSpecialtyRepository.findByTechnician(user);
        technicianSpecialtyRepository.deleteAll(existing);

        String specialtyName = null;
        if (request.specialty() != null) {
            TechnicianSpecialty ts = TechnicianSpecialty.builder()
                    .technician(user)
                    .specialty(request.specialty())
                    .isAvailable(true)
                    .build();
            technicianSpecialtyRepository.save(ts);
            specialtyName = request.specialty().name();
        }

        return UserResponseDto.from(user, specialtyName);
    }

    public User findById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
}
