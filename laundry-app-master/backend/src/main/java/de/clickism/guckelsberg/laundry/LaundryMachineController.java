package de.clickism.guckelsberg.laundry;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static jakarta.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
import static jakarta.servlet.http.HttpServletResponse.SC_CREATED;

@AllArgsConstructor
@RestController
@RequestMapping("/api/laundry/machines")
public class LaundryMachineController {

    private final LaundryMachineRepository machineRepository;

    @GetMapping
    public @ResponseBody List<LaundryMachine> getMachines() {
        return machineRepository.findAll();
    }

    @PreAuthorize("hasRole('LAUNDRY_ADMIN')")
    @PostMapping
    public ResponseEntity<?> createMachine(@RequestBody LaundryMachine.Dto dto) {
        if (machineRepository.existsById(dto.name())) {
            return ResponseEntity.status(SC_BAD_REQUEST)
                    .body("Machine with this name already exists");
        }
        LaundryMachine machine = new LaundryMachine(
                dto.name(),
                dto.type(),
                dto.slotDuration()
        );
        machineRepository.save(machine);
        return ResponseEntity.status(SC_CREATED).body(machine);
    }

    @Transactional
    @PreAuthorize("hasRole('LAUNDRY_ADMIN')")
    @DeleteMapping
    public ResponseEntity<?> deleteMachine(@RequestParam String name) {
        if (machineRepository.existsById(name)) {
            machineRepository.deleteById(name);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
