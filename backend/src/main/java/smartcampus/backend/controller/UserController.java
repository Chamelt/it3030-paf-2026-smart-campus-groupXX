package smartcampus.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import smartcampus.backend.dto.RoleUpdateRequest;
import smartcampus.backend.dto.SpecialtyUpdateRequest;
import smartcampus.backend.dto.UserResponseDto;
import smartcampus.backend.entity.User;
import smartcampus.backend.service.UserService;

import java.util.List;
import java.util.UUID;

/**
 * Module E – User management endpoints.
 *
 * GET   /api/users/me          → authenticated user's own profile (ALL roles)
 * GET   /api/users             → list all users (ADMIN only)
 * PATCH /api/users/{id}/role   → update a user's role (ADMIN only)
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * GET /api/users/me  →  200
     * Returns the authenticated user's own profile and role.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getMyProfile(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getMyProfile(currentUser));
    }

    /**
     * GET /api/users  →  200  (ADMIN only)
     * Lists all registered users.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * PATCH /api/users/{id}/role  →  200 / 400 / 404  (ADMIN only)
     * Updates a user's role to USER, ADMIN, or TECHNICIAN.
     */
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody RoleUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserRole(id, request));
    }

    @PatchMapping("/{id}/specialty")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> updateTechnicianSpecialty(
            @PathVariable UUID id,
            @RequestBody SpecialtyUpdateRequest request) {
        return ResponseEntity.ok(userService.updateTechnicianSpecialty(id, request));
    }
}
