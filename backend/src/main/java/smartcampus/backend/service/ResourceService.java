package smartcampus.backend.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smartcampus.backend.dto.CreateResourceRequest;
import smartcampus.backend.dto.ResourceResponse;
import smartcampus.backend.dto.UpdateResourceRequest;
import smartcampus.backend.entity.Resource;
import smartcampus.backend.enums.ResourceStatus;
import smartcampus.backend.enums.ResourceType;
import smartcampus.backend.exception.ResourceNotFoundException;
import smartcampus.backend.repository.ResourceRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final S3ImageService s3ImageService;
    private final EntityManager entityManager;

    public List<ResourceResponse> getAllResources(
        ResourceType type,
        ResourceStatus status,
        String floor,
        Integer minCapacity,
        String feature,
        String search) {
        
    return resourceRepository
            .findAllWithFilters(
                    type != null ? type.name() : null,
                    status != null ? status.name() : null,
                    floor,
                    minCapacity,
                    feature,
                    search)
            .stream()
            .map(ResourceResponse::fromEntity)
            .toList();
}

    public ResourceResponse getResourceById(UUID id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
        return ResourceResponse.fromEntity(resource);
    }


    @Transactional
    public ResourceResponse createResource(CreateResourceRequest request, MultipartFile image) {
        if (request.getType() != ResourceType.EQUIPMENT && request.getCapacity() == null) {
            throw new IllegalArgumentException("Capacity is required for rooms and labs");
        }
        if (!request.getAvailabilityEnd().isAfter(request.getAvailabilityStart())) {
            throw new IllegalArgumentException("Availability end must be after start time");
        }

        String imageUrl = (image != null && !image.isEmpty())
                ? s3ImageService.uploadImage(image)
                : null;

        Resource resource = Resource.builder()
                .name(request.getName())
                .type(request.getType())
                .capacity(request.getCapacity())
                .floor(request.getFloor())
                .locationDescription(request.getLocationDescription())
                .availabilityStart(request.getAvailabilityStart())
                .availabilityEnd(request.getAvailabilityEnd())
                .features(request.getFeatures())
                .imageUrl(imageUrl)
                .build();

        Resource savedResource = resourceRepository.save(resource);
        return ResourceResponse.fromEntity(savedResource);
    }

    @Transactional
    public ResourceResponse updateResource(UUID id, UpdateResourceRequest request, MultipartFile image) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        if (existing.getStatus() == ResourceStatus.DECOMMISSIONED) {
            throw new IllegalArgumentException("Cannot update a decommissioned resource");
        }
        if (request.getType() != ResourceType.EQUIPMENT && request.getCapacity() == null) {
            throw new IllegalArgumentException("Capacity is required for rooms and labs");
        }
        if (!request.getAvailabilityEnd().isAfter(request.getAvailabilityStart())) {
            throw new IllegalArgumentException("Availability end must be after start time");
        }

        String imageUrl = existing.getImageUrl();
        if (image != null && !image.isEmpty()) {
            s3ImageService.deleteImage(existing.getImageUrl());
            imageUrl = s3ImageService.uploadImage(image);
        }

        existing.setName(request.getName());
        existing.setType(request.getType());
        existing.setCapacity(request.getCapacity());
        existing.setFloor(request.getFloor());
        existing.setLocationDescription(request.getLocationDescription());
        existing.setAvailabilityStart(request.getAvailabilityStart());
        existing.setAvailabilityEnd(request.getAvailabilityEnd());
        existing.setFeatures(request.getFeatures());
        existing.setImageUrl(imageUrl);

        Resource savedResource = resourceRepository.save(existing);
        return ResourceResponse.fromEntity(savedResource);
    }

    @Transactional
    public ResourceResponse updateResourceStatus(UUID id, ResourceStatus newStatus) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        if (newStatus == ResourceStatus.DECOMMISSIONED
                && resource.getStatus() == ResourceStatus.DECOMMISSIONED) {
            throw new IllegalArgumentException("Resource is already decommissioned");
        }
        if (newStatus == ResourceStatus.ACTIVE
                && resource.getStatus() == ResourceStatus.DECOMMISSIONED) {
            throw new IllegalArgumentException("Cannot reactivate a decommissioned resource");
        }

        resource.setStatus(newStatus);
        resource.setUpdatedAt(LocalDateTime.now());

        Resource savedResource = resourceRepository.save(resource);
        return ResourceResponse.fromEntity(savedResource);
    }

    @Transactional
    public void deleteResource(UUID id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
    
        if (resource.getStatus() == ResourceStatus.DECOMMISSIONED) {
            throw new IllegalArgumentException("Resource is already decommissioned");
        }
    
        // Clean up S3 image since this resource is permanently retired
        if (resource.getImageUrl() != null) {
            s3ImageService.deleteImage(resource.getImageUrl());
            resource.setImageUrl(null);
        }
    
        resource.setStatus(ResourceStatus.DECOMMISSIONED);
        resource.setUpdatedAt(LocalDateTime.now());
        resourceRepository.save(resource);
    }
}
