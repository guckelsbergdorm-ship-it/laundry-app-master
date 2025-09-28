package de.clickism.guckelsberg.laundry;

import de.clickism.guckelsberg.user.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.ListCrudRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LaundryBookingRepository extends ListCrudRepository<LaundryBooking, Long> {
    List<LaundryBooking> findByDate(LocalDate date);

    List<LaundryBooking> findByDateGreaterThanEqual(LocalDate dateIsGreaterThan);

    List<LaundryBooking> findByDateAndSlotStart(LocalDate date, Integer slotStart);

    List<LaundryBooking> findByBookerAndDateGreaterThanEqualOrderByDateAscSlotStartAsc(User booker, LocalDate dateIsGreaterThan);

    List<LaundryBooking> findByBookerAndDateBetweenAndMachine_Type(User booker, LocalDate dateAfter, LocalDate dateBefore, LaundryMachine.MachineType machineType);

    List<LaundryBooking> findByMachineAndDateBetween(LaundryMachine machine, LocalDate dateAfter, LocalDate dateBefore);

    List<LaundryBooking> findByBookerOrderByDateDescSlotStartDesc(User booker, Pageable pageable);
}
