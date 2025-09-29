package de.clickism.guckelsberg.laundry;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import static jakarta.servlet.http.HttpServletResponse.*;

@RestController
@RequestMapping("/api/laundry/overrides")
@RequiredArgsConstructor
public class LaundrySlotOverrideController {

    private final LaundrySlotOverrideRepository overrideRepository;
    private final LaundryMachineRepository machineRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<LaundrySlotOverride.Dto> listOverrides(
            @RequestParam(required = false) String machineName,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return overrideRepository.search(machineName, from, to)
                .stream()
                .map(LaundrySlotOverride::toDto)
                .toList();
    }

    @PostMapping
    @Transactional
    @PreAuthorize("hasAnyRole('MASTER_ADMIN','LAUNDRY_ADMIN')")
    public ResponseEntity<?> createOverride(
            @RequestBody LaundrySlotOverride.CreateDto dto,
            Authentication authentication
    ) {
        try {
            LaundrySlotOverride override = buildOverride(dto, authentication.getName());
            overrideRepository.save(override);
            return ResponseEntity.status(SC_CREATED).body(override.toDto());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(SC_BAD_REQUEST).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyRole('MASTER_ADMIN','LAUNDRY_ADMIN')")
    public ResponseEntity<?> updateOverride(
            @PathVariable Long id,
            @RequestBody LaundrySlotOverride.UpdateDto dto
    ) {
        LaundrySlotOverride override = overrideRepository.findById(id).orElse(null);
        if (override == null) {
            return ResponseEntity.status(SC_NOT_FOUND).body("Override not found.");
        }
        applyUpdate(override, dto);
        overrideRepository.save(override);
        return ResponseEntity.ok(override.toDto());
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyRole('MASTER_ADMIN','LAUNDRY_ADMIN')")
    public ResponseEntity<?> deleteOverride(@PathVariable Long id) {
        if (!overrideRepository.existsById(id)) {
            return ResponseEntity.status(SC_NOT_FOUND).body("Override not found.");
        }
        overrideRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private LaundrySlotOverride buildOverride(LaundrySlotOverride.CreateDto dto, String createdBy) {
        LaundryMachine machine = machineRepository.findById(dto.machineName())
                .orElseThrow(() -> new IllegalArgumentException("Machine not found: " + dto.machineName()));
        validateDto(dto.startDate(), dto.endDate(), dto.startSlot(), dto.endSlot(), machine.getSlotDuration());
        LaundrySlotOverride override = new LaundrySlotOverride();
        override.setMachine(machine);
        override.setStatus(dto.status());
        override.setStartDate(dto.startDate());
        override.setEndDate(dto.endDate());
        override.setStartSlot(dto.startSlot());
        override.setEndSlot(dto.endSlot());
        override.setCreatedBy(createdBy);
        override.setCreatedAt(new Date());
        return override;
    }

    private void applyUpdate(LaundrySlotOverride override, LaundrySlotOverride.UpdateDto dto) {
        LocalDate startDate = dto.startDate() != null ? dto.startDate() : override.getStartDate();
        LocalDate endDate = dto.endDate() != null ? dto.endDate() : override.getEndDate();
        Integer startSlot = dto.startSlot() != null ? dto.startSlot() : override.getStartSlot();
        Integer endSlot = dto.endSlot() != null ? dto.endSlot() : override.getEndSlot();
        validateDto(startDate, endDate, startSlot, endSlot, override.getMachine().getSlotDuration());
        if (dto.status() != null) {
            override.setStatus(dto.status());
        }
        override.setStartDate(startDate);
        override.setEndDate(endDate);
        override.setStartSlot(startSlot);
        override.setEndSlot(endSlot);
    }

    private void validateDto(LocalDate startDate, LocalDate endDate, Integer startSlot, Integer endSlot, Integer slotDuration) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date are required.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be on or after start date.");
        }
        if (startSlot != null && (startSlot < 0 || startSlot >= 1440)) {
            throw new IllegalArgumentException("Start slot must be between 0 and 1439 minutes.");
        }
        if (endSlot != null && (endSlot < 0 || endSlot >= 1440)) {
            throw new IllegalArgumentException("End slot must be between 0 and 1439 minutes.");
        }
        if (startSlot != null && endSlot != null && endSlot < startSlot) {
            throw new IllegalArgumentException("End slot must be greater than or equal to start slot.");
        }
        if (slotDuration != null && slotDuration > 0) {
            if (startSlot != null && startSlot % LaundryMachine.BASE_SLOT_DURATION != 0) {
                throw new IllegalArgumentException("Start slot must align with 90-minute increments.");
            }
            if (endSlot != null && endSlot % LaundryMachine.BASE_SLOT_DURATION != 0) {
                throw new IllegalArgumentException("End slot must align with 90-minute increments.");
            }
        }
    }
}