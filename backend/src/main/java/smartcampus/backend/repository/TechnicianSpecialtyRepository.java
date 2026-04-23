package smartcampus.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import smartcampus.backend.entity.TechnicianSpecialty;
import smartcampus.backend.entity.User;
import smartcampus.backend.enums.TicketCategory;

import java.util.List;
import java.util.UUID;

public interface TechnicianSpecialtyRepository extends JpaRepository<TechnicianSpecialty, UUID> {

    List<TechnicianSpecialty> findBySpecialtyAndIsAvailableTrue(TicketCategory specialty);

    List<TechnicianSpecialty> findByTechnician(User technician);
}
