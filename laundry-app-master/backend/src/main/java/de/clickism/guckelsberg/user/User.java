package de.clickism.guckelsberg.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.lang.Nullable;

import java.util.Date;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    private String roomNumber;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    @Nullable
    private Date lastBookingActivity;

    @Nullable
    private Long maxWasherMinutesPerWeek;

    @Nullable
    private Long maxDryerMinutesPerWeek;

    public Dto toDto() {
        return new Dto(
                roomNumber,
                role,
                lastBookingActivity,
                maxWasherMinutesPerWeek,
                maxDryerMinutesPerWeek
        );
    }

    public enum Role {
        USER,
        STAFF,
        LAUNDRY_ADMIN,
        ROOFTOP_ADMIN,
        MASTER_ADMIN
    }

    public record Dto(
            String roomNumber,
            Role role,
            Date lastBookingActivity,
            Long maxWasherMinutesPerWeek,
            Long maxDryerMinutesPerWeek
    ) {
    }

    public record CreateDto(
            String roomNumber,
            String password,
            Role role,
            Long maxWasherMinutesPerWeek,
            Long maxDryerMinutesPerWeek
    ) {
    }
}
