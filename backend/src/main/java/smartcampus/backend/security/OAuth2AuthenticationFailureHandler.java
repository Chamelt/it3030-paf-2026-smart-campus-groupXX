// Feature branch: feature/E-oauth2-google-login
// Called when Google login fails. Redirects the user to /login?error=oauth2_failed
// so the React frontend can display a friendly error message.
package smartcampus.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationFailureHandler.class);

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.error("OAuth2 authentication failed: {}", exception.getMessage());

        String redirectUri = UriComponentsBuilder
                .fromUriString(frontendUrl + "/login")
                .queryParam("error", "oauth2_failed")
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUri);
    }
}
