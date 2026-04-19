package smartcampus.backend.scheduler;

import smartcampus.backend.entity.Booking;
import smartcampus.backend.enums.BookingStatus;
import smartcampus.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingExpiryScheduler {

    private final BookingRepository bookingRepository;

    // Configurable buffer — defaults to 30 minutes if not set in properties
    @Value("${booking.expiry.buffer-minutes:30}")
    private int bufferMinutes;

    // ================================================================
    // Runs every 60 seconds.
    // Finds all PENDING and IN_REVIEW bookings that have not been
    // approved at least `bufferMinutes` before their start time.
    //
    // Example with buffer = 30:
    // Booking at 10:00 AM → cutoff = 09:30 AM
    // If scheduler runs at 09:31 and booking is still PENDING → CANCELLED
    //
    // Two cases caught by the query:
    // 1. bookingDate is in the past entirely
    // 2. bookingDate is today and startTime is within or past the cutoff
    // ================================================================
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expireOverdueBookings() {
        LocalDate today = LocalDate.now();
        LocalTime cutoff = LocalTime.now().plusMinutes(bufferMinutes);

        log.info("Booking expiry check running at {}. Cutoff time: {} (buffer: {} min)",
                LocalDateTime.now(), cutoff, bufferMinutes);

        List<Booking> overdueBookings = bookingRepository.findOverdueBookings(today, cutoff);

        if (overdueBookings.isEmpty()) {
            log.debug("No overdue bookings found.");
            return;
        }

        for (Booking booking : overdueBookings) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancellationReason(
                    "Booking was not approved at least " + bufferMinutes + " minutes before the " +
                            "scheduled start time and has been automatically cancelled.");
            bookingRepository.save(booking);

            log.warn(
                    "Auto-cancelled booking id={} | resource='{}' | scheduled={} {} | was status={}",
                    booking.getBookingId(),
                    booking.getResource().getName(),
                    booking.getBookingDate(),
                    booking.getStartTime(),
                    booking.getStatus());

            // TODO: Member 4 — send notification to booking owner
        }

        log.info("Auto-expiry complete. Cancelled {} booking(s).", overdueBookings.size());
    }

    // ================================================================
    // Runs every hour.
    // Finds all PENDING, IN_REVIEW, and APPROVED bookings for resources
    // that are OUT_OF_SERVICE and scheduled within the next 24 hours.
    // Cancels them immediately with a clear reason so users are notified.
    //
    // Example:
    // Resource "Lab B201" goes OUT_OF_SERVICE at 10:00 AM
    // Booking for "Lab B201" at 3:00 PM today → cancelled immediately
    // Booking for "Lab B201" at 9:00 AM tomorrow → cancelled immediately
    // Booking for "Lab B201" at 9:00 AM day after tomorrow → NOT cancelled yet
    // ================================================================
    @Scheduled(fixedRate = 3_600_000) // every hour
    @Transactional
    public void cancelBookingsForOutOfServiceResources() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        LocalTime now = LocalTime.now();

        log.info("Out-of-service check running at {}. Checking bookings within 24h for OUT_OF_SERVICE resources.",
                LocalDateTime.now());

        List<Booking> affected = bookingRepository
                .findActiveBookingsForOutOfServiceResources(today, tomorrow, now);

        if (affected.isEmpty()) {
            log.debug("No bookings affected by out-of-service resources.");
            return;
        }

        for (Booking booking : affected) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancellationReason(
                    "The resource '" + booking.getResource().getName() + "' has been taken " +
                            "OUT_OF_SERVICE. Your booking on " + booking.getBookingDate() +
                            " at " + booking.getStartTime() + " has been automatically cancelled. " +
                            "Please book an alternative resource.");
            bookingRepository.save(booking);

            log.warn(
                    "Cancelled booking id={} | resource='{}' (OUT_OF_SERVICE) | scheduled={} {} | was status={}",
                    booking.getBookingId(),
                    booking.getResource().getName(),
                    booking.getBookingDate(),
                    booking.getStartTime(),
                    booking.getStatus());

            // TODO: Member 4 — notify user their booking was cancelled due to resource
            // being out of service
        }

        log.info("Out-of-service check complete. Cancelled {} booking(s).", affected.size());
    }
}