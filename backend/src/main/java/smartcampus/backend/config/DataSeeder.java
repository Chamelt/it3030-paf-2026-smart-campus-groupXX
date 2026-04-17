// Feature branch: feature/E-admin-seeding
// Runs once on application startup (ApplicationRunner).
// Ensures whitelisted admin emails are promoted to ADMIN role in the database.
// If the user hasn't logged in yet, the promotion happens in CustomOAuth2UserService
// on their first Google login instead.
package smartcampus.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import smartcampus.backend.enums.UserRole;
import smartcampus.backend.repository.UserRepository;

import java.util.List;

/**
 * Runs once on startup.
 * Ensures known admin emails are promoted to ADMIN role,
 * whether they already exist in DB or are created as placeholder records
 * (full profile filled in on first Google login).
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final List<String> ADMIN_EMAILS = List.of(
            "himandiweerasekara2002@gmail.com",
            "vithushan0504@gmail.com",
            "chameltsocials@gmail.com"
    );

    private final UserRepository userRepository;

    public DataSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (String email : ADMIN_EMAILS) {
            userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    if (user.getRole() != UserRole.ADMIN) {
                        user.setRole(UserRole.ADMIN);
                        userRepository.save(user);
                        log.info("Promoted existing user {} to ADMIN", email);
                    } else {
                        log.info("User {} is already ADMIN", email);
                    }
                },
                () -> log.info("Admin email {} not yet registered — will be promoted on first login", email)
            );
        }
    }
}
