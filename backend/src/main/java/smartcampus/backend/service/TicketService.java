package smartcampus.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import smartcampus.backend.dto.*;
import smartcampus.backend.entity.*;
import smartcampus.backend.enums.*;
import smartcampus.backend.repository.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final TechnicianSpecialtyRepository specialtyRepository;
    private final S3Service s3Service;

    public TicketService(TicketRepository ticketRepository,
                         TicketCommentRepository commentRepository,
                         TicketAttachmentRepository attachmentRepository,
                         UserRepository userRepository,
                         ResourceRepository resourceRepository,
                         TechnicianSpecialtyRepository specialtyRepository,
                         S3Service s3Service) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.specialtyRepository = specialtyRepository;
        this.s3Service = s3Service;
    }

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, List<MultipartFile> images, User currentUser) {
        if (images != null && images.size() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum 3 images allowed per ticket");
        }

        if (images != null) {
            for (MultipartFile img : images) {
                String mime = img.getContentType();
                if (!"image/jpeg".equals(mime) && !"image/png".equals(mime)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG and PNG images are allowed");
                }
                if (img.getSize() > 5_242_880L) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each image must not exceed 5MB");
                }
            }
        }

        String resourceName = request.getResourceName();
        if (request.getResourceId() != null) {
            Resource resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource not found"));
            resourceName = resource.getName();
        }

        Ticket ticket = Ticket.builder()
                .resourceId(request.getResourceId())
                .resourceName(resourceName)
                .locationText(request.getLocationText())
                .createdBy(currentUser)
                .category(request.getCategory())
                .priority(request.getPriority())
                .description(request.getDescription())
                .contactDetails(request.getContactDetails())
                .status(TicketStatus.OPEN)
                .build();

        Ticket saved = ticketRepository.save(ticket);

        if (images != null) {
            for (MultipartFile img : images) {
                try {
                    String fileUrl = s3Service.uploadFile(img, saved.getTicketId().toString());
                    TicketAttachment attachment = TicketAttachment.builder()
                            .ticket(saved)
                            .fileName(img.getOriginalFilename())
                            .fileUrl(fileUrl)
                            .fileSizeBytes(img.getSize())
                            .mimeType(img.getContentType())
                            .build();
                    attachmentRepository.save(attachment);
                } catch (IOException e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload image");
                }
            }
        }

        return toResponse(ticketRepository.findById(saved.getTicketId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets(User currentUser) {
        return ticketRepository.findByCreatedBy(currentUser).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getMyAssignedTickets(User currentUser) {
        return ticketRepository.findByAssignedTo(currentUser).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(UUID ticketId) {
        return toResponse(findTicketOrThrow(ticketId));
    }

    @Transactional
    public TicketResponse assignTechnician(UUID ticketId, AssignTicketRequest request) {
        Ticket ticket = findTicketOrThrow(ticketId);

        if (ticket.getStatus() != TicketStatus.OPEN && ticket.getStatus() != TicketStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket must be OPEN or PENDING to assign a technician");
        }

        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Technician not found"));

        if (technician.getRole() != UserRole.TECHNICIAN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned user must have TECHNICIAN role");
        }

        ticket.setAssignedTo(technician);
        ticket.setStatus(TicketStatus.ASSIGNED);
        ticket.setAssignedAt(LocalDateTime.now());

        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponse acceptTicket(UUID ticketId, boolean markOutOfService, User currentUser) {
        Ticket ticket = findTicketOrThrow(ticketId);

        if (ticket.getAssignedTo() == null ||
                !ticket.getAssignedTo().getUserId().equals(currentUser.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this ticket");
        }

        if (ticket.getStatus() != TicketStatus.ASSIGNED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket must be ASSIGNED to accept");
        }

        ticket.setAcceptedAt(LocalDateTime.now());
        ticket.setStatus(TicketStatus.IN_PROGRESS);

        if (markOutOfService && ticket.getResourceId() != null) {
            resourceRepository.findById(ticket.getResourceId()).ifPresent(resource -> {
                resource.setStatus(ResourceStatus.OUT_OF_SERVICE);
                resourceRepository.save(resource);
                System.out.println("[AUTO-SYNC] Resource '" + resource.getName() + "' → OUT_OF_SERVICE");
            });
        }

        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponse updateStatus(UUID ticketId, UpdateTicketStatusRequest request, User currentUser) {
        Ticket ticket = findTicketOrThrow(ticketId);

        switch (request.getStatus()) {
            case RESOLVED -> {
                if (request.getResolutionNotes() == null || request.getResolutionNotes().isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resolution notes are required");
                }
                boolean isAssigned = ticket.getAssignedTo() != null &&
                        currentUser.getUserId().equals(ticket.getAssignedTo().getUserId());
                if (!isAssigned && currentUser.getRole() != UserRole.ADMIN) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Only the assigned technician or an admin can resolve a ticket");
                }
                ticket.setResolutionNotes(request.getResolutionNotes());
                ticket.setResolvedAt(LocalDateTime.now());

                if (ticket.getResourceId() != null) {
                    resourceRepository.findById(ticket.getResourceId()).ifPresent(resource -> {
                        resource.setStatus(ResourceStatus.ACTIVE);
                        resourceRepository.save(resource);
                        System.out.println("[AUTO-SYNC] Resource '" + resource.getName() + "' → ACTIVE");
                    });
                }
            }
            case REJECTED -> {
                if (currentUser.getRole() != UserRole.ADMIN) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can reject tickets");
                }
                if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required");
                }
                ticket.setRejectionReason(request.getRejectionReason());
            }
            case CLOSED -> {
                if (currentUser.getRole() != UserRole.ADMIN) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can close tickets");
                }
                if (ticket.getStatus() != TicketStatus.RESOLVED) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only RESOLVED tickets can be closed");
                }
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status transition: " + request.getStatus());
        }

        ticket.setStatus(request.getStatus());
        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional(readOnly = true)
    public List<TechnicianDropdownResponse> getTechniciansByCategory(TicketCategory category) {
        return specialtyRepository.findBySpecialtyAndIsAvailableTrue(category).stream()
                .map(spec -> TechnicianDropdownResponse.builder()
                        .userId(spec.getTechnician().getUserId())
                        .name(spec.getTechnician().getName())
                        .email(spec.getTechnician().getEmail())
                        .isAvailable(Boolean.TRUE.equals(spec.getIsAvailable()))
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResourceDropdownResponse> getResourcesForDropdown(String floor, String type) {
        String typeParam  = (type  != null && !type.isBlank())  ? type  : null;
        String floorParam = (floor != null && !floor.isBlank()) ? floor : null;

        return resourceRepository.findAllWithFilters(typeParam, "ACTIVE", floorParam, null, null, null)
                .stream()
                .map(r -> ResourceDropdownResponse.builder()
                        .resourceId(r.getResourceId())
                        .name(r.getName())
                        .type(r.getType())
                        .floor(r.getFloor())
                        .capacity(r.getCapacity())
                        .status(r.getStatus())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctResourceTypes() {
        return resourceRepository.findDistinctActiveTypes();
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctFloors() {
        return resourceRepository.findDistinctActiveFloors();
    }

    @Transactional
    public TicketResponse addComment(UUID ticketId, AddCommentRequest request, User currentUser) {
        Ticket ticket = findTicketOrThrow(ticketId);

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(currentUser)
                .content(request.getContent())
                .build();

        commentRepository.save(comment);
        return toResponse(ticketRepository.findById(ticketId).orElseThrow());
    }

    @Transactional
    public TicketResponse editComment(UUID ticketId, UUID commentId, AddCommentRequest request, User currentUser) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!comment.getAuthor().getUserId().equals(currentUser.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own comments");
        }

        comment.setContent(request.getContent());
        commentRepository.save(comment);
        return toResponse(findTicketOrThrow(ticketId));
    }

    @Transactional
    public void deleteComment(UUID commentId, User currentUser) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        boolean isAuthor = comment.getAuthor().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own comments");
        }

        comment.setIsDeleted(true);
        commentRepository.save(comment);
    }

    private Ticket findTicketOrThrow(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Ticket not found: " + ticketId));
    }

    private TicketResponse toResponse(Ticket ticket) {
        List<TicketComment> activeComments =
                commentRepository.findByTicketAndIsDeletedFalseOrderByCreatedAtAsc(ticket);

        List<TicketResponse.AttachmentDto> attachmentDtos = ticket.getAttachments().stream()
                .map(a -> TicketResponse.AttachmentDto.builder()
                        .attachmentId(a.getAttachmentId())
                        .fileName(a.getFileName())
                        .fileUrl(a.getFileUrl())
                        .fileSizeBytes(a.getFileSizeBytes())
                        .mimeType(a.getMimeType())
                        .build())
                .toList();

        List<TicketResponse.CommentDto> commentDtos = activeComments.stream()
                .map(c -> TicketResponse.CommentDto.builder()
                        .commentId(c.getCommentId())
                        .authorId(c.getAuthor().getUserId())
                        .authorName(c.getAuthor().getName())
                        .content(c.getContent())
                        .createdAt(c.getCreatedAt())
                        .updatedAt(c.getUpdatedAt())
                        .build())
                .toList();

        return TicketResponse.builder()
                .ticketId(ticket.getTicketId())
                .resourceId(ticket.getResourceId())
                .resourceName(ticket.getResourceName())
                .locationText(ticket.getLocationText())
                .createdByName(ticket.getCreatedBy().getName())
                .createdByEmail(ticket.getCreatedBy().getEmail())
                .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getUserId() : null)
                .assignedToName(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : null)
                .category(ticket.getCategory())
                .priority(ticket.getPriority())
                .description(ticket.getDescription())
                .contactDetails(ticket.getContactDetails())
                .status(ticket.getStatus())
                .rejectionReason(ticket.getRejectionReason())
                .resolutionNotes(ticket.getResolutionNotes())
                .assignedAt(ticket.getAssignedAt())
                .acceptedAt(ticket.getAcceptedAt())
                .resolvedAt(ticket.getResolvedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .attachments(attachmentDtos)
                .comments(commentDtos)
                .build();
    }
}
