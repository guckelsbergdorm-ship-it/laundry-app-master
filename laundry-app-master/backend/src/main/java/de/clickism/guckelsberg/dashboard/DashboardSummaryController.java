package de.clickism.guckelsberg.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardSummaryController {

    private final DashboardSummaryService dashboardSummaryService;

    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public DashboardSummaryDto getSummary(Authentication authentication) {
        return dashboardSummaryService.buildSummary(authentication.getName());
    }
}