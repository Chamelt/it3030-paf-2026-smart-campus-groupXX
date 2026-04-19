package smartcampus.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StatsResponseDTO {
    private long pending;
    private long inReview;
    private long approvedToday;
    private long rejected;
    private long cancelled;
    private long totalApproved;
}