package smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;
import smartcampus.backend.enums.TicketCategory;
import smartcampus.backend.enums.TicketPriority;
import smartcampus.backend.enums.TicketStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TicketResponse {

    private UUID ticketId;
    private UUID resourceId;
    private String resourceName;
    private String locationText;
    private String createdByName;
    private String createdByEmail;
    private UUID assignedToId;
    private String assignedToName;
    private TicketCategory category;
    private TicketPriority priority;
    private String description;
    private String contactDetails;
    private TicketStatus status;
    private String rejectionReason;
    private String resolutionNotes;
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AttachmentDto> attachments;
    private List<CommentDto> comments;

    @Data
    @Builder
    public static class AttachmentDto {
        private UUID attachmentId;
        private String fileName;
        private String fileUrl;
        private Long fileSizeBytes;
        private String mimeType;
    }

    @Data
    @Builder
    public static class CommentDto {
        private UUID commentId;
        private UUID authorId;
        private String authorName;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
