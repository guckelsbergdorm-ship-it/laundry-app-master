package de.clickism.guckelsberg.laundry;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LaundrySlotOverrideService {

    private final LaundrySlotOverrideRepository overrideRepository;

    public boolean isSlotBlocked(LaundryMachine machine, LocalDate date, int slotStart) {
        return findActiveOverrides(machine, date)
                .stream()
                .filter(override -> override.getStatus() == LaundrySlotOverride.Status.BLOCKED)
                .anyMatch(override -> override.appliesTo(slotStart));
    }

    public boolean isSlotExplicitlyAllowed(LaundryMachine machine, LocalDate date, int slotStart) {
        return findActiveOverrides(machine, date)
                .stream()
                .filter(override -> override.getStatus() == LaundrySlotOverride.Status.EXTENDED)
                .anyMatch(override -> override.appliesTo(slotStart));
    }

    public List<LaundrySlotOverride> listOverrides(String machineName, LocalDate from, LocalDate to) {
        return overrideRepository.search(machineName, from, to);
    }

    public List<LaundrySlotOverride> findActiveOverrides(LaundryMachine machine, LocalDate date) {
        return overrideRepository.findActiveForMachineOnDate(machine.getName(), date);
    }
}