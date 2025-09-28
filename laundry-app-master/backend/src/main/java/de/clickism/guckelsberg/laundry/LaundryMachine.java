package de.clickism.guckelsberg.laundry;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class LaundryMachine {
    public static final int BASE_SLOT_DURATION = 90; // 90 minutes

    @Id
    private String name;

    @Enumerated(EnumType.STRING)
    private MachineType type;

    /**
     * Duration of a slot in minutes
     */
    private Integer slotDuration;

    /**
     * Checks if the given slot is a valid start slot.
     *
     * @param slotStart the slot to check
     * @return true if the slot is valid, false otherwise
     */
    public static boolean isValidSlotStart(int slotStart) {
        if (slotStart < 0 || slotStart >= 1440) {
            return false;
        }
        return slotStart % BASE_SLOT_DURATION == 0;
    }

    public Dto toDto() {
        return new Dto(
                name,
                type,
                slotDuration
        );
    }

    public enum MachineType {
        WASHER,
        DRYER
    }

    public record Dto(
            String name,
            MachineType type,
            Integer slotDuration
    ) {
    }
}
