package smartcampus.backend.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import smartcampus.backend.enums.ResourceStatus;
import smartcampus.backend.enums.ResourceType;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "resources")
@EntityListeners(AuditingEntityListener.class)
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "resource_id", updatable = false)
    private UUID resourceId;

    @NotBlank(message = "Resource name is required")
    @Column(name = "name", nullable = false)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type;

    @Positive(message = "Capacity must be a positive number")
    @Column
    private Integer capacity;

    @NotBlank(message = "Floor is required")
    @Column(nullable = false)
    private String floor;

    @NotBlank
    @Column(name = "location_description", nullable = false, columnDefinition = "TEXT")
    private String locationDescription;

    @NotNull
    @Column(name = "availability_start", nullable = false)
    private LocalTime availabilityStart;

    @NotNull
    @Column(name = "availability_end", nullable = false)
    private LocalTime availabilityEnd;

    @NotNull
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status = ResourceStatus.ACTIVE;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> features;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
