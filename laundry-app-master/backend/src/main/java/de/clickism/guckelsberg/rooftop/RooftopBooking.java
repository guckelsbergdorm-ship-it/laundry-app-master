package de.clickism.guckelsberg.rooftop;

import de.clickism.guckelsberg.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class RooftopBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(nullable = false)
    private User booker;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Date createdAt;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    public Dto toDto(boolean includeReason) {
        return new Dto(
                id,
                booker.getRoomNumber(),
                date,
                includeReason ? reason : null
        );
    }

    public record Dto(
            Long id,
            String bookerRoomNumber,
            LocalDate date,
            String reason
    ) {
    }
}
