package de.clickism.guckelsberg.laundry;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;

@Getter
@Setter
@Entity
@Table(name = "laundry_slot_overrides")
public class LaundrySlotOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "machine_id")
    private LaundryMachine machine;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    /**
     * Minutes since start of day at which the override begins. Null means the entire day.
     */
    private Integer startSlot;

    /**
     * Minutes since start of day at which the override ends (inclusive). Null means the entire day.
     */
    private Integer endSlot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false)
    private String createdBy;

    @Column(nullable = false)
    private Date createdAt;

    public boolean appliesTo(int slotStart) {
        boolean afterStart = startSlot == null || slotStart >= startSlot;
        boolean beforeEnd = endSlot == null || slotStart <= endSlot;
        return afterStart && beforeEnd;
    }

    public Dto toDto() {
        return new Dto(
                id,
                machine.getName(),
                status,
                startDate,
                endDate,
                startSlot,
                endSlot,
                createdBy,
                createdAt
        );
    }

    public enum Status {
        BLOCKED,
        EXTENDED
    }

    public record Dto(
            Long id,
            String machineName,
            Status status,
            LocalDate startDate,
            LocalDate endDate,
            Integer startSlot,
            Integer endSlot,
            String createdBy,
            Date createdAt
    ) {
    }

    public record CreateDto(
            String machineName,
            Status status,
            LocalDate startDate,
            LocalDate endDate,
            Integer startSlot,
            Integer endSlot
    ) {
    }

    public record UpdateDto(
            Status status,
            LocalDate startDate,
            LocalDate endDate,
            Integer startSlot,
            Integer endSlot
    ) {
    }
}