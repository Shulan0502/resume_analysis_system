package com.black.job.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/db-info")
    public Map<String, Object> getDbInfo() {
        Map<String, Object> result = new HashMap<>();
        try {
            String dbName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
            result.put("database", dbName);
            
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM job_postings", Integer.class);
            result.put("job_postings_count", count);
            
            result.put("success", true);
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }
}
