package smartcampus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PeakHourDTO {
    private int hour; // 0-23
    private long count; // number of approved bookings in this hour
}