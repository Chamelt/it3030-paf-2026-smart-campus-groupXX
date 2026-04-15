package smartcampus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import smartcampus.backend.enums.ResourceStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilityResponse {

    private UUID resourceId;
    private LocalDate date;
    private LocalTime availabilityStart;
    private LocalTime availabilityEnd;
    private List<TimeSlot> bookedSlots;
    private ResourceStatus resourceStatus;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeSlot {
        private LocalTime startTime;
        private LocalTime endTime;
    }
}
