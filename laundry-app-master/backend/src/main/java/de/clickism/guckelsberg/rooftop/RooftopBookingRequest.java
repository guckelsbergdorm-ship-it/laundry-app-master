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
public class RooftopBookingRequest {
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

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contact;

    @Column(nullable = false)
    private String timeSpan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.REQUESTED;

    @ManyToOne
    @JoinColumn
    private User reviewedBy;

    private Date reviewedAt;

    @Column(columnDefinition = "TEXT")
    private String decisionReason;

    public boolean isApproved() {
        return status == Status.APPROVED;
    }

    public Dto toDto() {
        return new Dto(
                id,
                booker.getRoomNumber(),
                date,
                createdAt,
                reason,
                contact,
                status,
                reviewedBy != null ? reviewedBy.getRoomNumber() : null,
                reviewedAt,
                decisionReason,
                timeSpan
        );
    }

    public record Dto(
            Long id,
            String bookerRoomNumber,
            LocalDate date,
            Date createdAt,
            String reason,
            String contact,
            Status status,
            String reviewedByRoomNumber,
            Date reviewedAt,
            String decisionReason,
            String timeSpan
    ) {
    }

    public enum Status {
        REQUESTED,
        APPROVED,
        REJECTED,
        CANCELLED
    }

    public void approve(User reviewer, String decisionReason) {
        this.status = Status.APPROVED;
        this.reviewedBy = reviewer;
        this.reviewedAt = new Date();
        this.decisionReason = decisionReason;
    }

    public void reject(User reviewer, String decisionReason) {
        this.status = Status.REJECTED;
        this.reviewedBy = reviewer;
        this.reviewedAt = new Date();
        this.decisionReason = decisionReason;
    }

    public void cancel() {
        this.status = Status.CANCELLED;
        this.reviewedBy = null;
        this.reviewedAt = new Date();
        this.decisionReason = null;
    }
}