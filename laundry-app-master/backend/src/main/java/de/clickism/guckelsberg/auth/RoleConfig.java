package de.clickism.guckelsberg.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

import static de.clickism.guckelsberg.user.User.Role.*;

@Configuration
public class RoleConfig {
    @Bean
    public static RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.withDefaultRolePrefix()
                .role(LAUNDRY_ADMIN.name()).implies(STAFF.name())
                .role(ROOFTOP_ADMIN.name()).implies(STAFF.name())
                .role(MASTER_ADMIN.name()).implies(LAUNDRY_ADMIN.name())
                .role(MASTER_ADMIN.name()).implies(ROOFTOP_ADMIN.name())
                .role(STAFF.name()).implies(USER.name())
                .build();
    }

    @Bean
    static MethodSecurityExpressionHandler methodSecurityExpressionHandler(RoleHierarchy roleHierarchy) {
        DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setRoleHierarchy(roleHierarchy);
        return expressionHandler;
    }
}
