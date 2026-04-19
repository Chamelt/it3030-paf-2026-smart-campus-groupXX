package smartcampus.backend.controller;

import smartcampus.backend.entity.Resource;
import smartcampus.backend.exception.ResourceNotFoundException;
import smartcampus.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Minimal ResourceController — serves the booking module's resource picker.
 * Member 1 will replace this with their full implementation including
 * POST/PUT/DELETE endpoints, maintenance logs, image upload, etc.
 */
@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResourceController {

    private final ResourceRepository resourceRepository;

    // GET /api/resources — used by booking form to list available resources
    @GetMapping
    public ResponseEntity<List<Resource>> getAll() {
        return ResponseEntity.ok(resourceRepository.findAll());
    }

    // GET /api/resources/{id} — used by booking detail view
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getById(@PathVariable UUID id) {
        Resource resource = resourceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + id));
        return ResponseEntity.ok(resource);
    }
}