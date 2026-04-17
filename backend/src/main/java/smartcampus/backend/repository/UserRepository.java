// Feature branch: feature/E-user-entity-repository
// Spring Data JPA repository for the User entity.
// findByOauthSubject — used on every Google login to look up the existing user.
// findByEmail        — used by DataSeeder to promote admin emails on startup.
package smartcampus.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.UserRole;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByOauthSubject(String oauthSubject);

    Optional<User> findByEmail(String email);

    List<User> findAllByRole(UserRole role);
}
