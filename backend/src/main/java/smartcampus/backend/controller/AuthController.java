// Feature branch: feature/E-oauth2-google-login
// Authentication endpoints:
//   POST /api/auth/register  — create account with email + password
//   POST /api/auth/login     — sign in with email + password, returns JWT
//   GET  /api/auth/google    — redirect to Google OAuth2 consent screen
//   POST /api/auth/logout    — stateless logout (client discards JWT)
//   GET  /api/auth/token/validate — validate JWT, return user profile
package smartcampus.backend.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import smartcampus.backend.dto.AuthResponseDto;
import smartcampus.backend.dto.LoginRequest;
import smartcampus.backend.dto.RegisterRequest;
import smartcampus.backend.dto.UserResponseDto;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.UserRole;
import smartcampus.backend.repository.UserRepository;
import smartcampus.backend.security.JwtTokenProvider;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository   userRepository;
    private final PasswordEncoder  passwordEncoder;

    public AuthController(JwtTokenProvider jwtTokenProvider,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository   = userRepository;
        this.passwordEncoder  = passwordEncoder;
    }

    // ── Email/Password Register ───────────────────────────────────────────────

    /**
     * POST /api/auth/register
     * Creates a new account with email + password.
     * Returns 409 if the email is already registered.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.findByEmail(req.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email is already registered."));
        }

        User user = User.builder()
                .name(req.name())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .oauthProvider("LOCAL")
                .oauthSubject("local:" + req.email())   // unique subject for local users
                .role(UserRole.USER)
                .active(true)
                .build();

        user = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(AuthResponseDto.of(token, UserResponseDto.from(user)));
    }

    // ── Email/Password Login ──────────────────────────────────────────────────

    /**
     * POST /api/auth/login
     * Authenticates with email + password and returns a JWT.
     * Returns 401 if credentials are invalid.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByEmail(req.email()).orElse(null);

        if (user == null || user.getPassword() == null
                || !passwordEncoder.matches(req.password(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }

        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Account is disabled."));
        }

        String token = jwtTokenProvider.generateToken(user);
        return ResponseEntity.ok(AuthResponseDto.of(token, UserResponseDto.from(user)));
    }

    // ── Google OAuth2 ─────────────────────────────────────────────────────────

    /**
     * GET /api/auth/google → 302
     * Redirects to Spring Security's OAuth2 authorization endpoint for Google.
     */
    @GetMapping("/google")
    public void initiateGoogleLogin(HttpServletResponse response) throws IOException {
        response.sendRedirect("/oauth2/authorization/google");
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    /**
     * POST /api/auth/logout → 204
     * Stateless JWT — no server-side session exists.
     * The client must discard the token on its side.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    // ── Token Validate ────────────────────────────────────────────────────────

    /**
     * GET /api/auth/token/validate → 200 / 401
     * Validates the Bearer JWT and returns the user profile.
     */
    @GetMapping("/token/validate")
    public ResponseEntity<AuthResponseDto> validateToken(
            @AuthenticationPrincipal User currentUser,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(
                AuthResponseDto.of(token, UserResponseDto.from(currentUser)));
    }
}
