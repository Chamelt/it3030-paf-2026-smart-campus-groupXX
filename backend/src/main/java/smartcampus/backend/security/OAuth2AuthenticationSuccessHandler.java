// Feature branch: feature/E-oauth2-google-login
// Called after successful Google login. Issues a JWT and redirects:
//   ADMIN  → /admin/dashboard
//   Others → /
// Passes token and redirect path as query params to the React frontend.
package smartcampus.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import smartcampus.backend.enums.UserRole;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        SmartCampusOAuth2User oAuth2User = (SmartCampusOAuth2User) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(oAuth2User.getUser());

        // Redirect admins to /admin/dashboard, others to /
        String redirectPath = oAuth2User.getUser().getRole() == UserRole.ADMIN
                ? "/admin/dashboard"
                : "/";

        String redirectUri = UriComponentsBuilder
                .fromUriString(frontendUrl + "/oauth2/redirect")
                .queryParam("token", token)
                .queryParam("redirect", redirectPath)
                .build()
                .toUriString();

        log.info("OAuth2 success for {} ({}). Redirecting to {}",
                oAuth2User.getUser().getEmail(),
                oAuth2User.getUser().getRole(),
                redirectPath);

        getRedirectStrategy().sendRedirect(request, response, redirectUri);
    }
}
