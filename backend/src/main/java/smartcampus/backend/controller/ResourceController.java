package smartcampus.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smartcampus.backend.dto.AvailabilityResponse;
import smartcampus.backend.dto.CreateResourceRequest;
import smartcampus.backend.dto.ResourceResponse;
import smartcampus.backend.dto.UpdateResourceRequest;
import smartcampus.backend.enums.ResourceStatus;
import smartcampus.backend.enums.ResourceType;
import smartcampus.backend.service.ResourceService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ResourceResponse>> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) String floor,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String feature,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(
                resourceService.getAllResources(type, status, floor, minCapacity, feature, search));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable UUID id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @GetMapping("/{id}/availability")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AvailabilityResponse> getResourceAvailability(
            @PathVariable UUID id,
            @RequestParam LocalDate date) {
        return ResponseEntity.ok(resourceService.getResourceAvailability(id, date));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> createResource(
            @RequestPart("data") @Valid CreateResourceRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createResource(request, image));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable UUID id,
            @RequestPart("data") @Valid UpdateResourceRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(resourceService.updateResource(id, request, image));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> updateResourceStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        ResourceStatus newStatus = ResourceStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(resourceService.updateResourceStatus(id, newStatus));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
