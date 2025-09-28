package de.clickism.guckelsberg.laundry;

import de.clickism.guckelsberg.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"date", "slot", "machine_id"})
)
public class LaundryBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(nullable = false)
    private User booker;

    @ManyToOne
    @JoinColumn(nullable = false)
    private LaundryMachine machine;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Date createdAt;

    @Min(0)
    @Max(1440)
    @Column(nullable = false)
    private Integer slotStart;

    public boolean isOngoing() {
        return !isInPast() && getSlotStartTime().isBefore(LocalDateTime.now());
    }

    public boolean isInPast() {
        return getSlotEndTime().isBefore(LocalDateTime.now());
    }

    public LocalDateTime getSlotStartTime() {
        return date.atStartOfDay().plusMinutes(slotStart);
    }

    public LocalDateTime getSlotEndTime() {
        return date.atStartOfDay().plusMinutes(slotStart + machine.getSlotDuration());
    }

    public boolean isOverlapping(LaundryBooking other) {
        if (!machine.getName().equals(other.machine.getName())) {
            return false;
        }
        return this.getSlotStartTime().isBefore(other.getSlotEndTime())
               && this.getSlotEndTime().isAfter(other.getSlotStartTime());
    }

    public Dto toDto() {
        return new Dto(
                id,
                booker.getRoomNumber(),
                machine.toDto(),
                date,
                slotStart,
                createdAt
        );
    }

    public record Dto(
            Long id,
            String bookerRoomNumber,
            LaundryMachine.Dto machine,
            LocalDate date,
            Integer slotStart,
            Date createdAt
    ) {

    }

    public record CreateDto(
            String machineName,
            LocalDate date,
            Integer slotStart
    ) {

    }
}
