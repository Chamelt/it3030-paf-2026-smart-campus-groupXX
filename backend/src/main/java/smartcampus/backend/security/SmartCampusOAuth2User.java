// Feature branch: feature/E-oauth2-google-login
// Wraps Spring's OidcUser with our User entity and RBAC authority (ROLE_USER / ROLE_ADMIN).
// Must implement OidcUser (not just OAuth2User) because Google uses OpenID Connect.
package smartcampus.backend.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import smartcampus.backend.entity.User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Wraps Spring's OidcUser and attaches our User entity + RBAC authority.
 * Must implement OidcUser because Google uses OpenID Connect.
 */
public class SmartCampusOAuth2User implements OidcUser {

    private final OidcUser delegate;
    private final User user;

    public SmartCampusOAuth2User(OidcUser delegate, User user) {
        this.delegate = delegate;
        this.user     = user;
    }

    public User getUser() {
        return user;
    }

    // ── OidcUser ─────────────────────────────────────────────────────────────

    @Override
    public OidcIdToken getIdToken() {
        return delegate.getIdToken();
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return delegate.getUserInfo();
    }

    @Override
    public Map<String, Object> getClaims() {
        return delegate.getClaims();
    }

    // ── OAuth2User ────────────────────────────────────────────────────────────

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public String getName() {
        return user.getUserId().toString();
    }
}
