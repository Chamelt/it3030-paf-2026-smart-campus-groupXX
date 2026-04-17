// Feature branch: feature/E-oauth2-google-login
// Handles the OIDC user info after Google login.
// Creates or updates the local User record and auto-promotes whitelisted admin emails.
package smartcampus.backend.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.UserRole;
import smartcampus.backend.repository.UserRepository;

import java.util.List;

@Service
public class CustomOAuth2UserService extends OidcUserService {

    private static final Logger log = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    // Emails that are always promoted to ADMIN on first login
    private static final List<String> ADMIN_EMAILS = List.of(
            "himandiweerasekara2002@gmail.com",
            "vithushan0504@gmail.com",
            "chameltsocials@gmail.com"
    );

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String oauthSubject = oidcUser.getSubject();
        String email        = oidcUser.getEmail();
        String name         = oidcUser.getFullName();
        String picture      = oidcUser.getPicture();
        String provider     = userRequest.getClientRegistration().getRegistrationId().toUpperCase();

        User user = userRepository.findByOauthSubject(oauthSubject)
                .map(existing -> updateExistingUser(existing, name, picture))
                .orElseGet(() -> createNewUser(oauthSubject, email, name, picture, provider));

        // Always ensure admin emails have ADMIN role
        if (ADMIN_EMAILS.contains(email) && user.getRole() != UserRole.ADMIN) {
            user.setRole(UserRole.ADMIN);
            user = userRepository.save(user);
            log.info("Auto-promoted {} to ADMIN", email);
        }

        log.info("OIDC login: {} (role={})", email, user.getRole());
        return new SmartCampusOAuth2User(oidcUser, user);
    }

    private User createNewUser(String oauthSubject, String email, String name,
                               String picture, String provider) {
        // Assign ADMIN role immediately if email is in the admin list
        UserRole role = ADMIN_EMAILS.contains(email) ? UserRole.ADMIN : UserRole.USER;

        User user = User.builder()
                .email(email)
                .name(name)
                .profilePictureUrl(picture)
                .oauthProvider(provider)
                .oauthSubject(oauthSubject)
                .role(role)
                .active(true)
                .build();
        return userRepository.save(user);
    }

    private User updateExistingUser(User user, String name, String picture) {
        user.setName(name);
        user.setProfilePictureUrl(picture);
        return userRepository.save(user);
    }
}
