// Feature branch: feature/E-user-entity-repository
// JPA entity representing a campus user authenticated via Google OAuth2.
// Uses a manual Builder pattern (Lombok removed to avoid annotation-processor issues).
// The 'active' field maps to the 'is_active' column; named 'active' to avoid
// Lombok's boolean getter naming conflict.
package smartcampus.backend.entity;

import jakarta.persistence.*;
import smartcampus.backend.enums.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id", updatable = false, nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role = UserRole.USER;

    @Column(name = "oauth_provider", nullable = false, length = 50)
    private String oauthProvider;

    @Column(name = "oauth_subject", nullable = false, unique = true, length = 255)
    private String oauthSubject;

    // Null for Google OAuth2 users; set only for email/password registrations
    @Column(nullable = true)
    private String password;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── Constructors ─────────────────────────────────────────────────────────

    public User() {}

    // ── Lifecycle ────────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getUserId()                     { return userId; }
    public void setUserId(UUID userId)          { this.userId = userId; }

    public String getEmail()                    { return email; }
    public void setEmail(String email)          { this.email = email; }

    public String getName()                     { return name; }
    public void setName(String name)            { this.name = name; }

    public String getProfilePictureUrl()                        { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl)  { this.profilePictureUrl = profilePictureUrl; }

    public UserRole getRole()                   { return role; }
    public void setRole(UserRole role)          { this.role = role; }

    public String getOauthProvider()                    { return oauthProvider; }
    public void setOauthProvider(String oauthProvider)  { this.oauthProvider = oauthProvider; }

    public String getOauthSubject()                     { return oauthSubject; }
    public void setOauthSubject(String oauthSubject)    { this.oauthSubject = oauthSubject; }

    public String getPassword()                  { return password; }
    public void setPassword(String password)     { this.password = password; }

    public boolean isActive()                   { return active; }
    public void setActive(boolean active)       { this.active = active; }

    public LocalDateTime getCreatedAt()         { return createdAt; }
    public LocalDateTime getUpdatedAt()         { return updatedAt; }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String email;
        private String name;
        private String profilePictureUrl;
        private UserRole role = UserRole.USER;
        private String oauthProvider;
        private String oauthSubject;
        private String password;
        private boolean active = true;

        public Builder email(String email)                          { this.email = email; return this; }
        public Builder name(String name)                            { this.name = name; return this; }
        public Builder profilePictureUrl(String url)               { this.profilePictureUrl = url; return this; }
        public Builder role(UserRole role)                          { this.role = role; return this; }
        public Builder oauthProvider(String oauthProvider)         { this.oauthProvider = oauthProvider; return this; }
        public Builder oauthSubject(String oauthSubject)           { this.oauthSubject = oauthSubject; return this; }
        public Builder password(String password)                    { this.password = password; return this; }
        public Builder active(boolean active)                       { this.active = active; return this; }

        public User build() {
            User u = new User();
            u.email              = this.email;
            u.name               = this.name;
            u.profilePictureUrl  = this.profilePictureUrl;
            u.role               = this.role;
            u.oauthProvider      = this.oauthProvider;
            u.oauthSubject       = this.oauthSubject;
            u.password           = this.password;
            u.active             = this.active;
            return u;
        }
    }
}
