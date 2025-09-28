package de.clickism.guckelsberg.user;

import org.springframework.data.repository.ListCrudRepository;

import java.util.Optional;

public interface UserRepository extends ListCrudRepository<User, String> {
    Optional<User> findUserByRoomNumber(String roomNumber);
}
