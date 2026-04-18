// Feature branch: feature/E-rbac-security-config
// Defines the security filter chain:
//   - Stateless JWT sessions (no cookies)
//   - Google OIDC login via CustomOAuth2UserService
//   - Role-based URL access control (ADMIN-only endpoints)
//   - CORS allowed for the React frontend at localhost:5173
package smartcampus.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import smartcampus.backend.security.CustomOAuth2UserService;
import smartcampus.backend.security.JwtAuthenticationFilter;
import smartcampus.backend.security.OAuth2AuthenticationFailureHandler;
import smartcampus.backend.security.OAuth2AuthenticationSuccessHandler;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2FailureHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          CustomOAuth2UserService customOAuth2UserService,
                          OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler,
                          OAuth2AuthenticationFailureHandler oAuth2FailureHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customOAuth2UserService  = customOAuth2UserService;
        this.oAuth2SuccessHandler     = oAuth2SuccessHandler;
        this.oAuth2FailureHandler     = oAuth2FailureHandler;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/oauth2/**", "/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET,    "/api/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/api/users/*/role").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/resources").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/resources/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/api/resources/*/status").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/resources/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/bookings").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/bookings/*/approve").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/bookings/*/reject").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo ->
                    userInfo.oidcUserService(customOAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
                .failureHandler(oAuth2FailureHandler)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
