package de.clickism.guckelsberg.laundry;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.ListCrudRepository;

import java.time.LocalDate;
import java.util.List;

public interface LaundrySlotOverrideRepository extends ListCrudRepository<LaundrySlotOverride, Long> {

    List<LaundrySlotOverride> findByMachine_NameOrderByStartDateAsc(String machineName);

    @Query("SELECT o FROM LaundrySlotOverride o " +
            "WHERE o.machine.name = :machineName " +
            "AND o.startDate <= :date " +
            "AND o.endDate >= :date")
    List<LaundrySlotOverride> findActiveForMachineOnDate(String machineName, LocalDate date);

    @Query("SELECT o FROM LaundrySlotOverride o " +
            "WHERE (:machineName IS NULL OR o.machine.name = :machineName) " +
            "AND (:fromDate IS NULL OR o.endDate >= :fromDate) " +
            "AND (:toDate IS NULL OR o.startDate <= :toDate) " +
            "ORDER BY o.startDate ASC")
    List<LaundrySlotOverride> search(String machineName, LocalDate fromDate, LocalDate toDate);
}