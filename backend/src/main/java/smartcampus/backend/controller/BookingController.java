package smartcampus.backend.controller;

import smartcampus.backend.dto.*;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.BookingStatus;
import smartcampus.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    // ----------------------------------------------------------------
    // FEATURE 1 — POST /api/bookings
    // USER only — any authenticated user can create a booking
    // ----------------------------------------------------------------
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bookingService.createBooking(request, user.getUserId()));
    }

    // ----------------------------------------------------------------
    // FEATURE 2 — GET /api/bookings/{id}
    // Both roles — any authenticated user
    // ----------------------------------------------------------------
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    // ----------------------------------------------------------------
    // FEATURE 3 — GET /api/bookings/my
    // USER only
    // ----------------------------------------------------------------
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(bookingService.getMyBookings(user.getUserId(), status));
    }

    // ----------------------------------------------------------------
    // FEATURE 4 — GET /api/bookings
    // ADMIN only — also enforced at URL level in SecurityConfig
    // ----------------------------------------------------------------
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ResourceBookingsDTO>> getAllBookings(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(bookingService.getAllBookingsGrouped(user.getUserId(), status));
    }

    // ----------------------------------------------------------------
    // PUT /api/bookings/{id} — User edits their own PENDING/IN_REVIEW booking
    // ----------------------------------------------------------------
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable UUID id,
            @Valid @RequestBody BookingRequestDTO request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.updateBooking(id, request, user.getUserId()));
    }

    // ----------------------------------------------------------------
    // FEATURE 5 — PUT /api/bookings/{id}/review
    // ADMIN only — also enforced at URL level in SecurityConfig
    // ----------------------------------------------------------------
    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> markInReview(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.markInReview(id, user.getUserId()));
    }

    // ----------------------------------------------------------------
    // FEATURE 6 — PUT /api/bookings/{id}/reject
    // ADMIN only — also enforced at URL level in SecurityConfig
    // ----------------------------------------------------------------
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequestDTO body,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, body.getReason(), user.getUserId()));
    }

    // ----------------------------------------------------------------
    // FEATURE 7 — PUT /api/bookings/{id}/approve
    // ADMIN only — also enforced at URL level in SecurityConfig
    // ----------------------------------------------------------------
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> approveBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.approveBooking(id, user.getUserId()));
    }

    // ----------------------------------------------------------------
    // FEATURE 8 — PUT /api/bookings/{id}/cancel
    // USER (own booking) or ADMIN (any non-terminal booking)
    // Role is derived from the JWT principal, not a client header.
    // ----------------------------------------------------------------
    @PutMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable UUID id,
            @RequestBody(required = false) CancelRequestDTO body,
            @AuthenticationPrincipal User user) {
        boolean isAdmin = user.getRole().name().equals("ADMIN");
        String reason = (body != null) ? body.getReason() : null;
        return ResponseEntity.ok(bookingService.cancelBooking(id, reason, user.getUserId(), isAdmin));
    }

    // ----------------------------------------------------------------
    // FEATURE 9 — GET /api/bookings/calendar
    // Both roles — read only
    // ----------------------------------------------------------------
    @GetMapping("/calendar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponseDTO>> getCalendar(
            @RequestParam(required = false) UUID resourceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(bookingService.getCalendar(resourceId, startDate, endDate));
    }

    // ----------------------------------------------------------------
    // FEATURE 10 — GET /api/bookings/check-availability
    // Read only — no auth needed
    // ----------------------------------------------------------------
    @GetMapping("/check-availability")
    public ResponseEntity<AvailabilityResponseDTO> checkAvailability(
            @RequestParam UUID resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam(required = false) UUID excludeBookingId) {
        return ResponseEntity.ok(
                bookingService.checkAvailability(resourceId, date, startTime, endTime, excludeBookingId));
    }

    // ----------------------------------------------------------------
    // FEATURE 11 — GET /api/bookings/stats
    // ADMIN only — also enforced at URL level in SecurityConfig
    // ----------------------------------------------------------------
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StatsResponseDTO> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getStats(user.getUserId()));
    }

    // ----------------------------------------------------------------
    // FEATURE 12 — GET /api/bookings/peak-hours
    // ADMIN only — also enforced at URL level in SecurityConfig
    // ----------------------------------------------------------------
    @GetMapping("/peak-hours")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PeakHourDTO>> getPeakHours(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID resourceId) {
        return ResponseEntity.ok(bookingService.getPeakHours(user.getUserId(), resourceId));
    }
}
