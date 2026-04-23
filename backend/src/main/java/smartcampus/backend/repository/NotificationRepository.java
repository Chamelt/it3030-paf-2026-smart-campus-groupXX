package smartcampus.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smartcampus.backend.entity.Notification;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(UUID userId);

    long countByUser_UserIdAndIsReadFalse(UUID userId);

    boolean existsByNotifKey(String notifKey);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.userId = :userId AND n.isRead = false")
    void markAllReadByUserId(@Param("userId") UUID userId);
}
