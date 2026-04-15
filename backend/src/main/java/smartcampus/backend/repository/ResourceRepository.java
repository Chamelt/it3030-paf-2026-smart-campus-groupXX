package smartcampus.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smartcampus.backend.entity.Resource;
import smartcampus.backend.enums.ResourceStatus;
import smartcampus.backend.enums.ResourceType;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    @Query("""
            SELECT r FROM Resource r
            WHERE (:type IS NULL OR r.type = :type)
              AND (:status IS NULL OR r.status = :status)
              AND (:floor IS NULL OR LOWER(r.floor) LIKE LOWER(CONCAT('%', :floor, '%')))
              AND (:minCapacity IS NULL OR r.capacity >= :minCapacity)
              AND (:feature IS NULL OR LOWER(CAST(r.features AS string)) LIKE LOWER(CONCAT('%', :feature, '%')))
              AND (:search IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                                   OR LOWER(r.locationDescription) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    List<Resource> findAllWithFilters(
            @Param("type") ResourceType type,
            @Param("status") ResourceStatus status,
            @Param("floor") String floor,
            @Param("minCapacity") Integer minCapacity,
            @Param("feature") String feature,
            @Param("search") String search
    );

    List<Resource> findByStatus(ResourceStatus status);

    boolean existsByNameAndFloor(String name, String floor);
}
