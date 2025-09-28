package de.clickism.guckelsberg.presidium;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PresidiumMemberInitializer implements CommandLineRunner {

    private final PresidiumMemberRepository repository;

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }
        PresidiumMember member = new PresidiumMember();
        member.setName("Building Presidium");
        member.setTitle("Community Coordinator");
        member.setBio("Point of contact for shared amenities and resident initiatives.");
        member.setDisplayOrder(0);
        repository.save(member);
        log.info("Seeded default presidium member entry");
    }
}