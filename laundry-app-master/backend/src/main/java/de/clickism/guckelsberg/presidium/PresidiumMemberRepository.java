package de.clickism.guckelsberg.presidium;

import org.springframework.data.repository.ListCrudRepository;

import java.util.List;

public interface PresidiumMemberRepository extends ListCrudRepository<PresidiumMember, Long> {

    List<PresidiumMember> findByVisibleTrueOrderByDisplayOrderAscNameAsc();

    List<PresidiumMember> findAllByOrderByDisplayOrderAscNameAsc();
}