package de.clickism.guckelsberg.presidium;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@Entity
@Table(name = "presidium_members")
public class PresidiumMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String title;

    private String contact;

    private String portraitUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    @Column(nullable = false)
    private Boolean visible = true;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false, updatable = false)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        Date now = new Date();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }

    public Dto toDto() {
        return new Dto(
                id,
                name,
                title,
                contact,
                portraitUrl,
                bio,
                displayOrder,
                visible,
                createdAt,
                updatedAt
        );
    }

    public record Dto(
            Long id,
            String name,
            String title,
            String contact,
            String portraitUrl,
            String bio,
            Integer displayOrder,
            Boolean visible,
            Date createdAt,
            Date updatedAt
    ) {
    }

    public record CreateDto(
            String name,
            String title,
            String contact,
            String portraitUrl,
            String bio,
            Integer displayOrder,
            Boolean visible
    ) {
    }

    public record UpdateDto(
            String name,
            String title,
            String contact,
            String portraitUrl,
            String bio,
            Integer displayOrder,
            Boolean visible
    ) {
    }
}