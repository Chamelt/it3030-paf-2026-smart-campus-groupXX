package smartcampus.backend.entity;

import smartcampus.backend.enums.ResourceStatus;
import smartcampus.backend.enums.ResourceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @UuidGenerator
    @Column(name = "resource_id")
    private UUID resourceId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type;

    private Integer capacity;

    @Column(nullable = false)
    private String floor;

    @Column(name = "location_description", nullable = false)
    private String locationDescription;

    @Column(name = "availability_start", nullable = false)
    private LocalTime availabilityStart;

    @Column(name = "availability_end", nullable = false)
    private LocalTime availabilityEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> features;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}