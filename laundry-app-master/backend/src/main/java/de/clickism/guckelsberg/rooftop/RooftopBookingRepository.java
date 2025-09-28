package de.clickism.guckelsberg.rooftop;

import de.clickism.guckelsberg.user.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RooftopBookingRepository extends ListCrudRepository<RooftopBooking, Long> {
    List<RooftopBooking> findByDateBetween(LocalDate dateAfter, LocalDate dateBefore);

    Optional<RooftopBooking> findByDate(LocalDate date);

    List<RooftopBooking> findByBookerOrderByDateDesc(User booker);

    @Query("SELECT b FROM RooftopBooking b " +
            "WHERE (:fromDate IS NULL OR b.date >= :fromDate) " +
            "AND (:toDate IS NULL OR b.date <= :toDate) " +
            "AND (:bookerRoom IS NULL OR b.booker.roomNumber = :bookerRoom) " +
            "ORDER BY b.date DESC")
    List<RooftopBooking> search(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("bookerRoom") String bookerRoom
    );
}
