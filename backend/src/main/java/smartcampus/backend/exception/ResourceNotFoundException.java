package smartcampus.backend.exception;

import java.util.UUID;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(UUID id) {
        super("Resource not found with id: " + id);
    }
}
