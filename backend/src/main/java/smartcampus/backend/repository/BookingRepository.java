package smartcampus.backend.repository;

import smartcampus.backend.entity.Booking;
import smartcampus.backend.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    // ------------------------------------------------------------------
    // CONFLICT DETECTION — single source of truth
    // Blocks on PENDING, IN_REVIEW, and APPROVED.
    // First-come-first-served: if any active booking exists for this
    // resource/date/time, the new request is rejected immediately.
    // Overlap formula: existing.start < newEnd AND existing.end > newStart
    // ------------------------------------------------------------------
    @Query("""
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.resource.resourceId = :resourceId
            AND b.bookingDate = :date
            AND b.status IN ('PENDING', 'IN_REVIEW', 'APPROVED')
            AND b.startTime < :endTime
            AND b.endTime > :startTime
            AND (:excludeId IS NULL OR b.bookingId <> :excludeId)
            """)
    boolean existsConflict(
            @Param("resourceId") UUID resourceId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") UUID excludeId);

    // ------------------------------------------------------------------
    // AUTO-EXPIRY — find PENDING and IN_REVIEW bookings that have not
    // been approved before the cutoff time (start time - buffer mins).
    // Called by BookingExpiryScheduler every 60 seconds.
    // ------------------------------------------------------------------
    @Query("""
            SELECT b FROM Booking b
            WHERE b.status IN ('PENDING', 'IN_REVIEW')
            AND (
                b.bookingDate < :today
                OR (b.bookingDate = :today AND b.startTime <= :cutoff)
            )
            """)
    List<Booking> findOverdueBookings(
            @Param("today") LocalDate today,
            @Param("cutoff") LocalTime cutoff);

    // ------------------------------------------------------------------
    // OUT-OF-SERVICE CANCELLATION
    // Finds active bookings (PENDING, IN_REVIEW, APPROVED) for resources
    // that are OUT_OF_SERVICE and scheduled within the next 24 hours.
    // Called by BookingExpiryScheduler every hour.
    // ------------------------------------------------------------------
    @Query("""
            SELECT b FROM Booking b
            WHERE b.status IN ('PENDING', 'IN_REVIEW', 'APPROVED')
            AND b.resource.status = 'OUT_OF_SERVICE'
            AND (
                b.bookingDate = :today
                OR (b.bookingDate = :tomorrow AND b.startTime <= :currentTime)
            )
            """)
    List<Booking> findActiveBookingsForOutOfServiceResources(
            @Param("today") LocalDate today,
            @Param("tomorrow") LocalDate tomorrow,
            @Param("currentTime") LocalTime currentTime);

    // ------------------------------------------------------------------
    // USER — own bookings
    // ------------------------------------------------------------------
    List<Booking> findByUser_UserIdOrderByCreatedAtDesc(UUID userId);

    List<Booking> findByUser_UserIdAndStatusOrderByCreatedAtDesc(
            UUID userId, BookingStatus status);

    // ------------------------------------------------------------------
    // ADMIN — all bookings
    // ------------------------------------------------------------------
    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    // ------------------------------------------------------------------
    // ADMIN — bookings grouped by resource
    // ------------------------------------------------------------------
    List<Booking> findByResource_ResourceIdOrderByCreatedAtDesc(UUID resourceId);

    List<Booking> findByResource_ResourceIdAndStatusOrderByCreatedAtDesc(
            UUID resourceId, BookingStatus status);

    // ------------------------------------------------------------------
    // CALENDAR — approved bookings in date range
    // ------------------------------------------------------------------
    @Query("""
            SELECT b FROM Booking b
            WHERE b.bookingDate BETWEEN :startDate AND :endDate
            AND b.status = 'APPROVED'
            ORDER BY b.bookingDate ASC, b.startTime ASC
            """)
    List<Booking> findApprovedBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT b FROM Booking b
            WHERE b.resource.resourceId = :resourceId
            AND b.bookingDate BETWEEN :startDate AND :endDate
            AND b.status = 'APPROVED'
            ORDER BY b.bookingDate ASC, b.startTime ASC
            """)
    List<Booking> findApprovedByResourceBetweenDates(
            @Param("resourceId") UUID resourceId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // ------------------------------------------------------------------
    // STATS
    // ------------------------------------------------------------------
    long countByStatus(BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingDate = :date AND b.status = 'APPROVED'")
    long countApprovedToday(@Param("date") LocalDate date);

    // ------------------------------------------------------------------
    // ANALYTICS — peak booking hours
    // Returns count of APPROVED bookings per hour of day.
    // Used by the admin dashboard peak hours bar chart.
    // ------------------------------------------------------------------
    @Query(value = """
            SELECT hour_slot, COUNT(*) as count
            FROM bookings b
            CROSS JOIN generate_series(
                EXTRACT(HOUR FROM start_time)::int,
                EXTRACT(HOUR FROM end_time)::int
            ) AS hour_slot
            WHERE b.status = 'APPROVED'
            AND (CAST(:resourceId AS uuid) IS NULL OR b.resource_id = CAST(:resourceId AS uuid))
            GROUP BY hour_slot
            ORDER BY hour_slot
            """, nativeQuery = true)
    List<Object[]> countApprovedByHour(@Param("resourceId") UUID resourceId);
}