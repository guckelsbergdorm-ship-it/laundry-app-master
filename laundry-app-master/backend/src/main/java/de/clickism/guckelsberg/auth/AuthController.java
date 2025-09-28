package de.clickism.guckelsberg.auth;

import de.clickism.guckelsberg.user.User;
import de.clickism.guckelsberg.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    public static final String USERNAME_KEY = "roomNumber";

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;

    @PostMapping("login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpSession session
    ) {
        try {
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(request.roomNumber(), request.password());
            Authentication auth = authenticationManager.authenticate(authToken);
            SecurityContextHolder.getContext().setAuthentication(auth);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            session.setAttribute(USERNAME_KEY, request.roomNumber());
            return ResponseEntity.ok().build();
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).body("Wrong room number or password");
        }
    }

    @GetMapping("status")
    public ResponseEntity<?> getStatus(
            HttpServletRequest request,
            Authentication auth
    ) {
        HttpSession session = request.getSession(false);
        if (session != null && auth != null && auth.isAuthenticated()) {
            User user = userRepository.findById(auth.getName()).orElseThrow();
            return ResponseEntity.ok().body(Map.of(
                    "status", "AUTHENTICATED",
                    "roomNumber", session.getAttribute(USERNAME_KEY),
                    "role", user.getRole().toString()
            ));
        }
        return ResponseEntity.ok().body(Map.of("status", "UNAUTHENTICATED"));
    }

    public record LoginRequest(String roomNumber, String password) {}
}
