package smartcampus.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables Spring's @Scheduled task executor for the notification module.
 *
 * This also activates the existing BookingExpiryScheduler which shares the
 * same mechanism — placing @EnableScheduling here keeps BackendApplication
 * clean and makes the scheduling concern owned by Module D.
 */
@Configuration
@EnableScheduling
public class NotificationConfig {
    // No beans needed — @EnableScheduling is the sole purpose of this class.
}
