package smartcampus.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smartcampus.backend.dto.*;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.TicketCategory;
import smartcampus.backend.service.TicketService;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    /**
     * Creates a new maintenance ticket with optional image attachments.
     * Any authenticated user can submit a ticket.
     * Role enforcement: none required — all authenticated users allowed (SecurityConfig: anyRequest().authenticated()).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketResponse> createTicket(
            @RequestPart("request") @Valid CreateTicketRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal User currentUser) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, images, currentUser));
    }

    /**
     * Returns all tickets in the system.
     * Intended for ADMIN and TECHNICIAN roles only.
     * Role enforcement: SecurityConfig (requestMatchers restrict this endpoint).
     */
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    /**
     * Returns tickets created by the currently authenticated user.
     * Any authenticated user can view their own tickets.
     * Role enforcement: none — service filters by currentUser.
     */
    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.getMyTickets(currentUser));
    }

    /**
     * Returns tickets assigned to the currently authenticated technician.
     * Intended for TECHNICIAN role only.
     * Role enforcement: SecurityConfig (requestMatchers restrict this endpoint).
     */
    @GetMapping("/assigned")
    public ResponseEntity<List<TicketResponse>> getMyAssignedTickets(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.getMyAssignedTickets(currentUser));
    }

    /**
     * Returns full details of a single ticket by its ID.
     * Any authenticated user can view ticket details.
     * Role enforcement: none — all authenticated users allowed.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable UUID id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    /**
     * Returns a filtered list of resources for the cascading dropdown on the new ticket form.
     * Floor and type are both optional — omitting either returns broader results.
     * Any authenticated user can call this (needed when filling the ticket form).
     * Role enforcement: none — all authenticated users allowed.
     */
    @GetMapping("/resources")
    public ResponseEntity<List<ResourceDropdownResponse>> getResourcesForDropdown(
            @RequestParam(required = false) String floor,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(ticketService.getResourcesForDropdown(floor, type));
    }

    /**
     * Returns the distinct list of resource types that exist in the database.
     * Used to populate the type dropdown dynamically so new types added to the DB appear automatically.
     * Any authenticated user can call this.
     * Role enforcement: none — all authenticated users allowed.
     */
    @GetMapping("/resource-types")
    public ResponseEntity<List<String>> getDistinctResourceTypes() {
        return ResponseEntity.ok(ticketService.getDistinctResourceTypes());
    }

    /**
     * Returns the distinct list of floors that exist in the database.
     * Used to populate the floor dropdown dynamically.
     * Any authenticated user can call this.
     * Role enforcement: none — all authenticated users allowed.
     */
    @GetMapping("/floors")
    public ResponseEntity<List<String>> getDistinctFloors() {
        return ResponseEntity.ok(ticketService.getDistinctFloors());
    }

    /**
     * Returns technicians filtered by specialty matching the given ticket category.
     * Used by admin when assigning a ticket so only relevant technicians are shown.
     * Intended for ADMIN only.
     * Role enforcement: SecurityConfig (requestMatchers restrict this endpoint).
     */
    @GetMapping("/technicians")
    public ResponseEntity<List<TechnicianDropdownResponse>> getTechniciansByCategory(
            @RequestParam TicketCategory category) {
        return ResponseEntity.ok(ticketService.getTechniciansByCategory(category));
    }

    /**
     * Assigns a technician to a ticket. Ticket must be OPEN or PENDING.
     * Intended for ADMIN only.
     * Role enforcement: SecurityConfig (requestMatchers restrict this endpoint).
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable UUID id,
            @RequestBody @Valid AssignTicketRequest request) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, request));
    }

    /**
     * Technician accepts the assigned ticket. Optionally marks the linked resource as OUT_OF_SERVICE.
     * Ticket must be in ASSIGNED status. Only the assigned technician can call this.
     * Role enforcement: SecurityConfig for TECH role; ownership check enforced in service layer.
     */
    @PostMapping("/{id}/accept")
    public ResponseEntity<TicketResponse> acceptTicket(
            @PathVariable UUID id,
            @RequestBody AcceptTicketRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.acceptTicket(id, request.isMarkOutOfService(), currentUser));
    }

    /**
     * Updates the status of a ticket (RESOLVED, REJECTED, or CLOSED).
     * Technician can resolve; ADMIN can reject or close. Rules enforced in service layer.
     * Role enforcement: service layer (checks role and ownership per status transition).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateTicketStatusRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.updateStatus(id, request, currentUser));
    }

    /**
     * Adds a comment to a ticket. Any authenticated user can comment.
     * Role enforcement: none — all authenticated users allowed.
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketResponse> addComment(
            @PathVariable UUID id,
            @RequestBody @Valid AddCommentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, request, currentUser));
    }

    /**
     * Edits an existing comment on a ticket.
     * Only the comment author can edit their own comment.
     * Role enforcement: service layer (checks author ownership).
     */
    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<TicketResponse> editComment(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId,
            @RequestBody @Valid AddCommentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.editComment(ticketId, commentId, request, currentUser));
    }

    /**
     * Soft-deletes a comment (sets isDeleted=true, record kept for audit).
     * The comment author or an ADMIN can delete.
     * Role enforcement: service layer (checks author ownership or ADMIN role).
     */
    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal User currentUser) {
        ticketService.deleteComment(commentId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
