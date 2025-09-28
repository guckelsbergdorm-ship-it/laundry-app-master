package de.clickism.guckelsberg.rooftop;

import de.clickism.guckelsberg.user.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RooftopBookingRequestRepository extends ListCrudRepository<RooftopBookingRequest, Long> {
    Optional<RooftopBookingRequest> findByDateAndBooker(LocalDate date, User booker);

    List<RooftopBookingRequest> findByBookerAndDateGreaterThanEqual(User booker, LocalDate dateIsGreaterThan);

    List<RooftopBookingRequest> findByDateGreaterThanEqual(LocalDate dateIsGreaterThan);

    @Query("SELECT r FROM RooftopBookingRequest r " +
            "WHERE (:booker IS NULL OR r.booker = :booker) " +
            "AND (:status IS NULL OR r.status = :status) " +
            "AND (:fromDate IS NULL OR r.date >= :fromDate) " +
            "AND (:toDate IS NULL OR r.date <= :toDate) " +
            "ORDER BY r.date DESC, r.createdAt DESC")
    List<RooftopBookingRequest> search(
            @Param("booker") User booker,
            @Param("status") RooftopBookingRequest.Status status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );
}
