package de.clickism.guckelsberg.presidium;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static jakarta.servlet.http.HttpServletResponse.*;

@RestController
@RequestMapping("/api/presidium")
@RequiredArgsConstructor
public class PresidiumMemberController {

    private final PresidiumMemberRepository repository;

    @GetMapping
    public List<PresidiumMember.Dto> getVisibleMembers() {
        return repository.findByVisibleTrueOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(PresidiumMember::toDto)
                .toList();
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    public List<PresidiumMember.Dto> getAllMembers() {
        return repository.findAllByOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(PresidiumMember::toDto)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    public ResponseEntity<?> createMember(@RequestBody PresidiumMember.CreateDto dto) {
        try {
            PresidiumMember member = new PresidiumMember();
            applyDto(member, dto);
            repository.save(member);
            return ResponseEntity.status(SC_CREATED).body(member.toDto());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(SC_BAD_REQUEST).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    public ResponseEntity<?> updateMember(
            @PathVariable Long id,
            @RequestBody PresidiumMember.UpdateDto dto
    ) {
        PresidiumMember member = repository.findById(id).orElse(null);
        if (member == null) {
            return ResponseEntity.status(SC_NOT_FOUND).body("Presidium member not found");
        }
        try {
            applyDto(member, dto);
            repository.save(member);
            return ResponseEntity.ok(member.toDto());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(SC_BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    public ResponseEntity<?> deleteMember(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(SC_NOT_FOUND).body("Presidium member not found");
        }
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private void applyDto(PresidiumMember member, PresidiumMember.CreateDto dto) {
        if (dto.name() == null || dto.name().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (dto.title() == null || dto.title().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        member.setName(dto.name().trim());
        member.setTitle(dto.title().trim());
        member.setContact(dto.contact() != null && !dto.contact().isBlank() ? dto.contact().trim() : null);
        member.setPortraitUrl(dto.portraitUrl() != null && !dto.portraitUrl().isBlank() ? dto.portraitUrl().trim() : null);
        member.setBio(dto.bio() != null && !dto.bio().isBlank() ? dto.bio().trim() : null);
        member.setDisplayOrder(dto.displayOrder() != null ? dto.displayOrder() : 0);
        member.setVisible(dto.visible() == null || dto.visible());
    }

    private void applyDto(PresidiumMember member, PresidiumMember.UpdateDto dto) {
        if (dto.name() != null && dto.name().isBlank()) {
            throw new IllegalArgumentException("Name cannot be blank");
        }
        if (dto.title() != null && dto.title().isBlank()) {
            throw new IllegalArgumentException("Title cannot be blank");
        }
        if (dto.name() != null) {
            member.setName(dto.name().trim());
        }
        if (dto.title() != null) {
            member.setTitle(dto.title().trim());
        }
        if (dto.contact() != null) {
            member.setContact(dto.contact().isBlank() ? null : dto.contact().trim());
        }
        if (dto.portraitUrl() != null) {
            member.setPortraitUrl(dto.portraitUrl().isBlank() ? null : dto.portraitUrl().trim());
        }
        if (dto.bio() != null) {
            member.setBio(dto.bio().isBlank() ? null : dto.bio().trim());
        }
        if (dto.displayOrder() != null) {
            member.setDisplayOrder(dto.displayOrder());
        }
        if (dto.visible() != null) {
            member.setVisible(dto.visible());
        }
    }
}