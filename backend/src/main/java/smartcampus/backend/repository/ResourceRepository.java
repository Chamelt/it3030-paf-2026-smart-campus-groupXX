package smartcampus.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smartcampus.backend.entity.Resource;
import smartcampus.backend.enums.ResourceStatus;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    @Query(value = """
            SELECT * FROM resources r
            WHERE (:type IS NULL OR r.type = :type)
              AND (:status IS NULL OR r.status = :status)
              AND (:floor IS NULL OR LOWER(r.floor) LIKE LOWER(CONCAT('%', :floor, '%')))
              AND (:minCapacity IS NULL OR r.capacity >= :minCapacity)
              AND (:feature IS NULL OR LOWER(r.features::text) LIKE LOWER(CONCAT('%', :feature, '%')))
              AND (:search IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                                   OR LOWER(r.location_description) LIKE LOWER(CONCAT('%', :search, '%')))
            """,
            nativeQuery = true)
    List<Resource> findAllWithFilters(
            @Param("type") String type,
            @Param("status") String status,
            @Param("floor") String floor,
            @Param("minCapacity") Integer minCapacity,
            @Param("feature") String feature,
            @Param("search") String search
    );

    List<Resource> findByStatus(ResourceStatus status);

    boolean existsByNameAndFloor(String name, String floor);

@Query(value = "SELECT DISTINCT type FROM resources WHERE status = 'ACTIVE'", nativeQuery = true)
List<String> findDistinctActiveTypes();

@Query(value = "SELECT DISTINCT floor FROM resources WHERE status = 'ACTIVE' ORDER BY floor", nativeQuery = true)
List<String> findDistinctActiveFloors();
}