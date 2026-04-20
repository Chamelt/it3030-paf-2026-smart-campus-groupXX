package smartcampus.backend.service;

import smartcampus.backend.dto.*;
import smartcampus.backend.entity.Booking;
import smartcampus.backend.entity.Resource;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.BookingStatus;
import smartcampus.backend.enums.ResourceStatus;
import smartcampus.backend.enums.UserRole;
import smartcampus.backend.exception.BookingConflictException;
import smartcampus.backend.exception.BookingValidationException;
import smartcampus.backend.exception.ResourceNotFoundException;
import smartcampus.backend.repository.BookingRepository;
import smartcampus.backend.repository.ResourceRepository;
import smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    // ================================================================
    // FEATURE 1 — POST /api/bookings — Create booking
    // Role enforcement handled by @PreAuthorize in controller.
    // Slot is locked the moment booking is saved as PENDING.
    // ================================================================
    public BookingResponseDTO createBooking(BookingRequestDTO dto, UUID userId) {
        log.info("Create booking: user={} resource={} date={}", userId, dto.getResourceId(), dto.getDate());

        User user = findUser(userId);
        Resource resource = findResource(dto.getResourceId());

        validateBookingInput(
                dto.getDate(),
                dto.getStartTime(),
                dto.getEndTime(),
                dto.getExpectedAttendees(),
                resource);

        boolean isPriority = Boolean.TRUE.equals(dto.getIsPriority());
        if (isPriority && (dto.getPriorityReason() == null || dto.getPriorityReason().isBlank())) {
            throw new BookingValidationException("priorityReason is required when isPriority is true");
        }

        Booking booking = Booking.builder()
                .resource(resource)
                .user(user)
                .bookingDate(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .purpose(dto.getPurpose())
                .expectedAttendees(dto.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .isPriority(isPriority)
                .priorityReason(dto.getPriorityReason())
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created id={}", saved.getBookingId());

        // TODO: Member 4 — notify all ADMIN users of new booking request
        return BookingResponseDTO.from(saved);
    }

    // ================================================================
    // FEATURE 2 — GET /api/bookings/{id} — Get single booking
    // ================================================================
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(UUID bookingId) {
        return BookingResponseDTO.from(findBooking(bookingId));
    }

    // ================================================================
    // FEATURE 3 — GET /api/bookings/my — User's own bookings
    // ================================================================
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(UUID userId, BookingStatus status) {
        List<Booking> bookings = (status != null)
                ? bookingRepository.findByUser_UserIdAndStatusOrderByCreatedAtDesc(userId, status)
                : bookingRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);

        return bookings.stream()
                .map(BookingResponseDTO::from)
                .collect(Collectors.toList());
    }

    // ================================================================
    // FEATURE 4 — GET /api/bookings — Admin: all bookings grouped by resource
    // ================================================================
    @Transactional(readOnly = true)
    public List<ResourceBookingsDTO> getAllBookingsGrouped(UUID adminId, BookingStatus statusFilter) {
        List<Booking> all = (statusFilter != null)
                ? bookingRepository.findByStatusOrderByCreatedAtDesc(statusFilter)
                : bookingRepository.findAllByOrderByCreatedAtDesc();

        Map<UUID, List<Booking>> grouped = all.stream()
                .collect(Collectors.groupingBy(b -> b.getResource().getResourceId()));

        List<ResourceBookingsDTO> result = new ArrayList<>();

        for (Map.Entry<UUID, List<Booking>> entry : grouped.entrySet()) {
            List<Booking> resourceBookings = entry.getValue();
            Resource resource = resourceBookings.get(0).getResource();

            List<BookingResponseDTO> bookingDTOs = resourceBookings.stream()
                    .map(BookingResponseDTO::from)
                    .collect(Collectors.toList());

            result.add(ResourceBookingsDTO.builder()
                    .resourceId(resource.getResourceId())
                    .resourceName(resource.getName())
                    .resourceType(resource.getType().name())
                    .resourceFloor(resource.getFloor())
                    .resourceCapacity(resource.getCapacity())
                    .bookings(bookingDTOs)
                    .build());
        }

        return result;
    }

    // ================================================================
    // FEATURE 5 — PUT /api/bookings/{id}/review — Admin marks IN_REVIEW
    // ================================================================
    public BookingResponseDTO markInReview(UUID bookingId, UUID adminId) {
        Booking booking = findBooking(bookingId);
        User admin = findUser(adminId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingValidationException(
                    "Only PENDING bookings can be marked IN_REVIEW. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.IN_REVIEW);
        booking.setReviewedBy(admin);
        booking.setReviewedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} marked IN_REVIEW by admin {}", bookingId, adminId);

        // TODO: Member 4 — notify requester their booking is being reviewed
        return BookingResponseDTO.from(saved);
    }

    // ================================================================
    // FEATURE 6 — PUT /api/bookings/{id}/reject — Admin rejects
    // ================================================================
    public BookingResponseDTO rejectBooking(UUID bookingId, String reason, UUID adminId) {
        Booking booking = findBooking(bookingId);
        User admin = findUser(adminId);

        if (booking.getStatus() != BookingStatus.IN_REVIEW) {
            throw new BookingValidationException(
                    "Only IN_REVIEW bookings can be rejected. Current status: " + booking.getStatus());
        }
        if (reason == null || reason.isBlank()) {
            throw new BookingValidationException("Rejection reason is mandatory");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        booking.setReviewedBy(admin);
        booking.setReviewedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} rejected by admin {}. Reason: {}", bookingId, adminId, reason);

        // TODO: Member 4 — notify requester with rejection reason
        return BookingResponseDTO.from(saved);
    }

    // ================================================================
    // FEATURE 7 — PUT /api/bookings/{id}/approve — Admin approves
    // No conflict check here — conflicts are blocked at submission time.
    // ================================================================
    public BookingResponseDTO approveBooking(UUID bookingId, UUID adminId) {
        Booking booking = findBooking(bookingId);
        User admin = findUser(adminId);

        if (booking.getStatus() != BookingStatus.IN_REVIEW) {
            throw new BookingValidationException(
                    "Only IN_REVIEW bookings can be approved. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setReviewedBy(admin);
        booking.setReviewedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} approved by admin {}", bookingId, adminId);

        // TODO: Member 4 — notify requester their booking is approved
        return BookingResponseDTO.from(saved);
    }

    // ================================================================
    // FEATURE 8 — PUT /api/bookings/{id}/cancel — Cancel booking
    // User: own PENDING or IN_REVIEW only. Reason optional.
    // Admin: any non-terminal status. Reason mandatory.
    // DB role check used here to distinguish admin vs user behaviour.
    // ================================================================
    public BookingResponseDTO cancelBooking(
            UUID bookingId, String reason, UUID requesterId, boolean isAdminHeader) {

        Booking booking = findBooking(bookingId);
        User requester = findUser(requesterId);
        boolean isAdmin = requester.getRole() == UserRole.ADMIN;

        if (isAdmin) {
            if (booking.getStatus() == BookingStatus.REJECTED ||
                    booking.getStatus() == BookingStatus.CANCELLED) {
                throw new BookingValidationException(
                        "Cannot cancel a booking with status: " + booking.getStatus());
            }
            if (reason == null || reason.isBlank()) {
                throw new BookingValidationException("Admin cancellation requires a reason");
            }
        } else {
            // Block TECHNICIAN role from cancelling
            requireRole(requesterId, UserRole.USER);
            if (!booking.getUser().getUserId().equals(requesterId)) {
                throw new BookingValidationException("You can only cancel your own bookings");
            }
            if (booking.getStatus() != BookingStatus.PENDING &&
                    booking.getStatus() != BookingStatus.IN_REVIEW) {
                throw new BookingValidationException(
                        "You can only cancel bookings that are PENDING or IN_REVIEW. Current status: "
                                + booking.getStatus());
            }
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} cancelled by requester={} role={}", bookingId, requesterId, requester.getRole());

        // TODO: Member 4 — notify relevant parties
        return BookingResponseDTO.from(saved);
    }

    // ================================================================
    // FEATURE 9 — GET /api/bookings/calendar — Approved bookings in range
    // ================================================================
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getCalendar(
            UUID resourceId, LocalDate startDate, LocalDate endDate) {

        if (startDate == null)
            startDate = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
        if (endDate == null)
            endDate = startDate.plusDays(6);

        List<Booking> bookings = (resourceId != null)
                ? bookingRepository.findApprovedByResourceBetweenDates(resourceId, startDate, endDate)
                : bookingRepository.findApprovedBetweenDates(startDate, endDate);

        return bookings.stream()
                .map(BookingResponseDTO::from)
                .collect(Collectors.toList());
    }

    // ================================================================
    // FEATURE 10 — GET /api/bookings/check-availability
    // ================================================================
    @Transactional(readOnly = true)
    public AvailabilityResponseDTO checkAvailability(
            UUID resourceId, LocalDate date, LocalTime startTime, LocalTime endTime, UUID excludeBookingId) {

        Resource resource = findResource(resourceId);

        if (!startTime.isBefore(endTime)) {
            return AvailabilityResponseDTO.builder()
                    .available(false)
                    .message("startTime must be before endTime")
                    .build();
        }

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            return AvailabilityResponseDTO.builder()
                    .available(false)
                    .message("Resource is " + resource.getStatus())
                    .build();
        }

        boolean conflict = bookingRepository.existsConflict(
                resourceId, date, startTime, endTime, excludeBookingId);

        return AvailabilityResponseDTO.builder()
                .available(!conflict)
                .message(conflict
                        ? resource.getName() + " is not available for the requested time slot"
                        : resource.getName() + " is available for the requested time slot")
                .build();
    }

    // ================================================================
    // FEATURE 11 — GET /api/bookings/stats — Admin dashboard counts
    // ================================================================
    @Transactional(readOnly = true)
    public StatsResponseDTO getStats(UUID adminId) {
        return StatsResponseDTO.builder()
                .pending(bookingRepository.countByStatus(BookingStatus.PENDING))
                .inReview(bookingRepository.countByStatus(BookingStatus.IN_REVIEW))
                .approvedToday(bookingRepository.countApprovedToday(LocalDate.now()))
                .rejected(bookingRepository.countByStatus(BookingStatus.REJECTED))
                .cancelled(bookingRepository.countByStatus(BookingStatus.CANCELLED))
                .totalApproved(bookingRepository.countByStatus(BookingStatus.APPROVED))
                .build();
    }

    // ================================================================
    // FEATURE 12 — GET /api/bookings/peak-hours — Peak booking hours
    // Returns approved booking count per hour (0-23).
    // ================================================================
    @Transactional(readOnly = true)
    public List<PeakHourDTO> getPeakHours(UUID adminId, UUID resourceId) {
        List<Object[]> raw = bookingRepository.countApprovedByHour(resourceId);

        Map<Integer, Long> hourMap = new HashMap<>();
        for (Object[] row : raw) {
            int hour = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            hourMap.put(hour, count);
        }

        List<PeakHourDTO> result = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            result.add(new PeakHourDTO(h, hourMap.getOrDefault(h, 0L)));
        }
        return result;
    }

    // ================================================================
    // FEATURE — PUT /api/bookings/{id} — User edits their own booking
    // Only allowed while status is PENDING or IN_REVIEW
    // ================================================================
    public BookingResponseDTO updateBooking(UUID bookingId, BookingRequestDTO dto, UUID userId) {
        Booking booking = findBooking(bookingId);

        if (!booking.getUser().getUserId().equals(userId)) {
            throw new BookingValidationException("You can only edit your own bookings");
        }
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.IN_REVIEW) {
            throw new BookingValidationException("Only PENDING or IN_REVIEW bookings can be edited");
        }

        Resource resource = booking.getResource();

        // Re-run validation but exclude this booking from conflict check
        if (!dto.getStartTime().isBefore(dto.getEndTime())) {
            throw new BookingValidationException("startTime must be before endTime");
        }
        LocalDateTime bookingStart = LocalDateTime.of(dto.getDate(), dto.getStartTime());
        if (bookingStart.isBefore(LocalDateTime.now().plusHours(2))) {
            throw new BookingValidationException("Bookings must be made at least 2 hours in advance");
        }
        if (dto.getStartTime().isBefore(resource.getAvailabilityStart())) {
            throw new BookingValidationException("startTime is before resource availability start");
        }
        if (dto.getEndTime().isAfter(resource.getAvailabilityEnd())) {
            throw new BookingValidationException("endTime is after resource availability end");
        }
        if (resource.getCapacity() != null && dto.getExpectedAttendees() != null
                && dto.getExpectedAttendees() > resource.getCapacity()) {
            throw new BookingValidationException("expectedAttendees exceeds resource capacity");
        }
        if (bookingRepository.existsConflict(
                resource.getResourceId(), dto.getDate(), dto.getStartTime(), dto.getEndTime(), bookingId)) {
            throw new BookingConflictException("This time slot is already taken. Please choose a different time.");
        }

        boolean isPriority = Boolean.TRUE.equals(dto.getIsPriority());
        if (isPriority && (dto.getPriorityReason() == null || dto.getPriorityReason().isBlank())) {
            throw new BookingValidationException("priorityReason is required when isPriority is true");
        }

        booking.setBookingDate(dto.getDate());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setPurpose(dto.getPurpose());
        booking.setExpectedAttendees(dto.getExpectedAttendees());
        booking.setIsPriority(isPriority);
        booking.setPriorityReason(dto.getPriorityReason());
        booking.setStatus(BookingStatus.PENDING);

        return BookingResponseDTO.from(bookingRepository.save(booking));
    }

    // ================================================================
    // SHARED — Validation Pipeline (called only by createBooking)
    // ================================================================
    private void validateBookingInput(
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            Integer expectedAttendees,
            Resource resource) {

        // 1. start must be before end
        if (!startTime.isBefore(endTime)) {
            throw new BookingValidationException("startTime must be before endTime");
        }

        // 2. Must be at least 2 hours in advance
        LocalDateTime bookingStart = LocalDateTime.of(date, startTime);
        LocalDateTime twoHoursFromNow = LocalDateTime.now().plusHours(2);
        if (bookingStart.isBefore(twoHoursFromNow)) {
            throw new BookingValidationException(
                    "Bookings must be made at least 2 hours in advance. " +
                            "The earliest you can book right now is " +
                            twoHoursFromNow.toLocalTime().withSecond(0).withNano(0) +
                            " today (or any future date).");
        }

        // 3. resource must be ACTIVE
        if (resource.getStatus() == ResourceStatus.OUT_OF_SERVICE) {
            throw new BookingValidationException(
                    "Resource '" + resource.getName() + "' is currently OUT_OF_SERVICE");
        }
        if (resource.getStatus() == ResourceStatus.DECOMMISSIONED) {
            throw new BookingValidationException(
                    "Resource '" + resource.getName() + "' is DECOMMISSIONED and cannot be booked");
        }

        // 4. times must be within resource availability window
        if (startTime.isBefore(resource.getAvailabilityStart())) {
            throw new BookingValidationException(
                    "startTime " + startTime + " is before resource availability start ("
                            + resource.getAvailabilityStart() + ")");
        }
        if (endTime.isAfter(resource.getAvailabilityEnd())) {
            throw new BookingValidationException(
                    "endTime " + endTime + " is after resource availability end ("
                            + resource.getAvailabilityEnd() + ")");
        }

        // 5. attendees must not exceed capacity (skip for equipment — null capacity)
        if (resource.getCapacity() != null && expectedAttendees != null) {
            if (expectedAttendees > resource.getCapacity()) {
                throw new BookingValidationException(
                        "expectedAttendees (" + expectedAttendees
                                + ") exceeds resource capacity (" + resource.getCapacity() + ")");
            }
        }

        // 6. conflict check — first-come-first-served
        if (bookingRepository.existsConflict(
                resource.getResourceId(), date, startTime, endTime, null)) {
            throw new BookingConflictException(
                    "This time slot is already taken for " + resource.getName()
                            + " on " + date + " " + startTime + "–" + endTime
                            + ". Please choose a different time.");
        }
    }

    // ================================================================
    // PRIVATE HELPERS
    // ================================================================
    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private Resource findResource(UUID resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));
    }

    private Booking findBooking(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
    }

    // ================================================================
    // SECURITY HELPER — Verify role from DB.
    // Currently used only in cancelBooking to block TECHNICIAN role.
    // Full @PreAuthorize enforcement activates when Member 4 integrates JWT.
    // ================================================================
    private void requireRole(UUID userId, UserRole... allowedRoles) {
        User user = findUser(userId);
        for (UserRole role : allowedRoles) {
            if (user.getRole() == role)
                return;
        }
        throw new BookingValidationException(
                "Access denied. Required: " + Arrays.toString(allowedRoles) +
                        ". Your role: " + user.getRole());
    }
}