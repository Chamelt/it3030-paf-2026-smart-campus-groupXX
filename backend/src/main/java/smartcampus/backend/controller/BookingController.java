package smartcampus.backend.controller;

import smartcampus.backend.dto.*;
import smartcampus.backend.enums.BookingStatus;
import smartcampus.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    // @PreAuthorize will enforce this once JWT is integrated
    // ----------------------------------------------------------------
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO request,
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bookingService.createBooking(request, userId));
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
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(bookingService.getMyBookings(userId, status));
    }

    // ----------------------------------------------------------------
    // FEATURE 4 — GET /api/bookings
    // ADMIN only
    // ----------------------------------------------------------------
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ResourceBookingsDTO>> getAllBookings(
            @RequestHeader("X-User-Id") UUID adminId,
            @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(bookingService.getAllBookingsGrouped(adminId, status));
    }

    // ----------------------------------------------------------------
    // PUT /api/bookings/{id} — User edits their own PENDING/IN_REVIEW booking
    // ----------------------------------------------------------------
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable UUID id,
            @Valid @RequestBody BookingRequestDTO request,
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(bookingService.updateBooking(id, request, userId));
    }

    // ----------------------------------------------------------------
    // FEATURE 5 — PUT /api/bookings/{id}/review
    // ADMIN only
    // ----------------------------------------------------------------
    @PutMapping("/{id}/review")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> markInReview(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID adminId) {
        return ResponseEntity.ok(bookingService.markInReview(id, adminId));
    }

    // ----------------------------------------------------------------
    // FEATURE 6 — PUT /api/bookings/{id}/reject
    // ADMIN only
    // ----------------------------------------------------------------
    @PutMapping("/{id}/reject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequestDTO body,
            @RequestHeader("X-User-Id") UUID adminId) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, body.getReason(), adminId));
    }

    // ----------------------------------------------------------------
    // FEATURE 7 — PUT /api/bookings/{id}/approve
    // ADMIN only
    // ----------------------------------------------------------------
    @PutMapping("/{id}/approve")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> approveBooking(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID adminId) {
        return ResponseEntity.ok(bookingService.approveBooking(id, adminId));
    }

    // ----------------------------------------------------------------
    // FEATURE 8 — PUT /api/bookings/{id}/cancel
    // USER (own) or ADMIN (any non-terminal)
    // ----------------------------------------------------------------
    @PutMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable UUID id,
            @RequestBody(required = false) CancelRequestDTO body,
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        String reason = (body != null) ? body.getReason() : null;
        return ResponseEntity.ok(bookingService.cancelBooking(id, reason, userId, isAdmin));
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
    // ADMIN only
    // ----------------------------------------------------------------
    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<StatsResponseDTO> getStats(
            @RequestHeader("X-User-Id") UUID adminId) {
        return ResponseEntity.ok(bookingService.getStats(adminId));
    }

    // ----------------------------------------------------------------
    // FEATURE 12 — GET /api/bookings/peak-hours
    // ADMIN only
    // ----------------------------------------------------------------
    @GetMapping("/peak-hours")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PeakHourDTO>> getPeakHours(
            @RequestHeader("X-User-Id") UUID adminId,
            @RequestParam(required = false) UUID resourceId) {
        return ResponseEntity.ok(bookingService.getPeakHours(adminId, resourceId));
    }
}