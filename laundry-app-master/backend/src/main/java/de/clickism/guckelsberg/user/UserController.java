package de.clickism.guckelsberg.user;

import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static jakarta.servlet.http.HttpServletResponse.*;

@Controller
@RequestMapping("/api/users")
@PreAuthorize("hasRole('MASTER_ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom;

    private static final char[] PASSWORD_ALPHABET = (
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789").toCharArray();
    private static final int DEFAULT_PASSWORD_LENGTH = 12;
    private static final int MIN_PASSWORD_LENGTH = 8;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.secureRandom = new SecureRandom();
    }

    @GetMapping("all")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll()
                .stream()
                .map(User::toDto)
                .toList());
    }

    @PostMapping
    public ResponseEntity<?> addUser(@RequestBody User.CreateDto dto) {
        if (userRepository.existsById(dto.roomNumber())) {
            return ResponseEntity.status(SC_CONFLICT)
                    .body("User with this room number already exists.");
        }
        User user = new User();
        user.setRoomNumber(dto.roomNumber());
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        user.setRole(dto.role());
        user.setMaxWasherMinutesPerWeek(dto.maxWasherMinutesPerWeek());
        user.setMaxDryerMinutesPerWeek(dto.maxDryerMinutesPerWeek());
        userRepository.save(user);
        return ResponseEntity.status(SC_CREATED)
                .body("User created successfully.");
    }

    @DeleteMapping("/{roomNumber}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable String roomNumber) {
        if (!userRepository.existsById(roomNumber)) {
            return ResponseEntity.status(SC_NOT_FOUND)
                    .body("User with this room number does not exist.");
        }
        userRepository.deleteById(roomNumber);
        return ResponseEntity.ok("User deleted successfully.");
    }

    @PatchMapping("/{roomNumber}")
    @Transactional
    public ResponseEntity<?> updateUser(
            @PathVariable String roomNumber,
            @RequestBody User.CreateDto dto
    ) {
        User user = userRepository.findById(roomNumber).orElse(null);
        if (user == null) {
            return ResponseEntity.status(SC_NOT_FOUND)
                    .body("User with this room number does not exist.");
        }
        if (dto.password() != null && !dto.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(dto.password()));
        }
        if (dto.role() != null) {
            user.setRole(dto.role());
        }
        if (dto.maxWasherMinutesPerWeek() != null) {
            user.setMaxWasherMinutesPerWeek(dto.maxWasherMinutesPerWeek());
        }
        if (dto.maxDryerMinutesPerWeek() != null) {
            user.setMaxDryerMinutesPerWeek(dto.maxDryerMinutesPerWeek());
        }
        userRepository.save(user);
        return ResponseEntity.ok("User updated successfully.");
    }

    @PostMapping("bulk/generate")
    @Transactional
    public ResponseEntity<?> generateUsers(@RequestBody GenerateUsersRequest request) {
        if (request.rooms() == null || request.rooms().isEmpty()) {
            return ResponseEntity.status(SC_BAD_REQUEST)
                    .body("At least one room number must be provided.");
        }

        int passwordLength = request.passwordLength() != null ? request.passwordLength() : DEFAULT_PASSWORD_LENGTH;
        if (passwordLength < MIN_PASSWORD_LENGTH) {
            return ResponseEntity.status(SC_BAD_REQUEST)
                    .body("Password length must be at least " + MIN_PASSWORD_LENGTH + ".");
        }

        Set<String> roomNumbers = new LinkedHashSet<>();
        for (String rawRoom : request.rooms()) {
            if (rawRoom == null) {
                return ResponseEntity.status(SC_BAD_REQUEST)
                        .body("Room numbers cannot be null.");
            }
            String normalized = rawRoom.trim();
            if (normalized.isEmpty()) {
                return ResponseEntity.status(SC_BAD_REQUEST)
                        .body("Room numbers cannot be blank.");
            }
            roomNumbers.add(normalized);
        }

        boolean overwriteExisting = Boolean.TRUE.equals(request.overwriteExisting());
        User.Role role = request.role();
        Long maxWasher = request.maxWasherMinutesPerWeek();
        Long maxDryer = request.maxDryerMinutesPerWeek();

        List<GeneratedUserCredential> generated = roomNumbers.stream()
                .map(roomNumber -> createOrUpdateUser(roomNumber, passwordLength, overwriteExisting, role, maxWasher, maxDryer))
                .toList();

        long createdCount = generated.stream().filter(entry -> entry.status() == GenerationStatus.CREATED).count();
        long updatedCount = generated.stream().filter(entry -> entry.status() == GenerationStatus.UPDATED).count();
        long skippedCount = generated.stream().filter(entry -> entry.status() == GenerationStatus.SKIPPED_EXISTS).count();

        return ResponseEntity.ok(new BulkGenerationResponse(
                generated,
                createdCount,
                updatedCount,
                skippedCount
        ));
    }

    private GeneratedUserCredential createOrUpdateUser(
            String roomNumber,
            int passwordLength,
            boolean overwriteExisting,
            User.Role role,
            Long maxWasherMinutes,
            Long maxDryerMinutes
    ) {
        User existing = userRepository.findById(roomNumber).orElse(null);
        if (existing != null && !overwriteExisting) {
            return new GeneratedUserCredential(roomNumber, null, GenerationStatus.SKIPPED_EXISTS);
        }

        boolean isNew = existing == null;
        User user = isNew ? new User() : existing;
        if (isNew) {
            user.setRoomNumber(roomNumber);
            user.setRole(role != null ? role : User.Role.USER);
        } else if (role != null) {
            user.setRole(role);
        }

        String rawPassword = generatePassword(passwordLength);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));

        if (maxWasherMinutes != null) {
            user.setMaxWasherMinutesPerWeek(maxWasherMinutes);
        }

        if (maxDryerMinutes != null) {
            user.setMaxDryerMinutesPerWeek(maxDryerMinutes);
        }

        userRepository.save(user);
        GenerationStatus status = isNew ? GenerationStatus.CREATED : GenerationStatus.UPDATED;
        return new GeneratedUserCredential(roomNumber, rawPassword, status);
    }

    private String generatePassword(int length) {
        char[] buffer = new char[length];
        for (int i = 0; i < length; i++) {
            buffer[i] = PASSWORD_ALPHABET[secureRandom.nextInt(PASSWORD_ALPHABET.length)];
        }
        return new String(buffer);
    }

    public record GenerateUsersRequest(
            List<String> rooms,
            Integer passwordLength,
            Boolean overwriteExisting,
            User.Role role,
            Long maxWasherMinutesPerWeek,
            Long maxDryerMinutesPerWeek
    ) {
    }

    public record GeneratedUserCredential(
            String roomNumber,
            String password,
            GenerationStatus status
    ) {
    }

    public record BulkGenerationResponse(
            List<GeneratedUserCredential> credentials,
            long created,
            long updated,
            long skipped
    ) {
    }

    public enum GenerationStatus {
        CREATED,
        UPDATED,
        SKIPPED_EXISTS
    }
}
