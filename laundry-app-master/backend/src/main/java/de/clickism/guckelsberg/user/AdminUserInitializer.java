package de.clickism.guckelsberg.user;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@AllArgsConstructor
@Component
public class AdminUserInitializer implements CommandLineRunner {
    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_PASSWORD = "guckelsberg";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        User user = new User();
        user.setRoomNumber(ADMIN_USERNAME);
        user.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
        user.setRole(User.Role.MASTER_ADMIN);
        userRepository.save(user);
        log.info("Admin user created with username '{}'", ADMIN_USERNAME);
    }
}
