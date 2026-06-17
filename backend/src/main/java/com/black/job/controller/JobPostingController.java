package com.black.job.controller;

import com.black.job.dto.JobPostingResponse;
import com.black.job.service.JobPostingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobPostingController {
    
    @Autowired
    private JobPostingService jobPostingService;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/create")
    public ResponseEntity<JobPostingResponse> createJob(@RequestBody JobPostingResponse.CreateJobRequest request) {
        try {
            JobPostingResponse response = jobPostingService.createJob(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(JobPostingResponse.error("发布岗位失败: " + e.getMessage()));
        }
    }
    

    @PutMapping("/{jobId}")
    public ResponseEntity<JobPostingResponse> updateJob(
            @PathVariable Long jobId,
            @RequestBody JobPostingResponse.UpdateJobRequest request) {
        try {
            JobPostingResponse response = jobPostingService.updateJob(jobId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(JobPostingResponse.error("更新岗位失败: " + e.getMessage()));
        }
    }
    

    @DeleteMapping("/{jobId}")
    public ResponseEntity<JobPostingResponse> deleteJob(
            @PathVariable Long jobId,
            @RequestParam Long companyId) {
        try {
            JobPostingResponse response = jobPostingService.deleteJob(jobId, companyId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(JobPostingResponse.error("删除岗位失败: " + e.getMessage()));
        }
    }
    

    @GetMapping("/company/{companyId}")
    public ResponseEntity<JobPostingResponse> getCompanyJobs(
            @PathVariable Long companyId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            JobPostingResponse response = jobPostingService.getCompanyJobs(companyId, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(JobPostingResponse.error("获取公司岗位失败: " + e.getMessage()));
        }
    }
    

    @GetMapping("/company/{companyId}/stats")
    public ResponseEntity<JobPostingResponse> getCompanyJobStats(@PathVariable Long companyId) {
        try {
            JobPostingResponse response = jobPostingService.getCompanyJobStats(companyId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(JobPostingResponse.error("获取统计数据失败: " + e.getMessage()));
        }
    }
    
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testDb() {
        Map<String, Object> response = new HashMap<>();
        try {
            String dbName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
            response.put("database", dbName);
            
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM job_postings", Integer.class);
            response.put("count", count);
            
            List<Map<String, Object>> jobs = jdbcTemplate.query(
                "SELECT id, title, company_name FROM job_postings LIMIT 3",
                (rs, rowNum) -> {
                    Map<String, Object> job = new HashMap<>();
                    job.put("id", rs.getLong("id"));
                    job.put("title", rs.getString("title"));
                    job.put("company_name", rs.getString("company_name"));
                    return job;
                }
            );
            response.put("sampleData", jobs);
            response.put("success", true);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            e.printStackTrace();
        }
        return ResponseEntity.ok(response);
    }
    

    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getAllActiveJobs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Integer totalCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM job_postings", Integer.class);
            
            if (totalCount == null || totalCount == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "数据库中没有数据");
                return ResponseEntity.ok(errorResponse);
            }
            
            int fromIndex = (page - 1) * size;
            
            List<Map<String, Object>> jobs = jdbcTemplate.query(
                "SELECT id, title, company_name, location, salary_extension, salary_unit, " +
                "experience_required, education_required, skills, welfarelist " +
                "FROM job_postings ORDER BY id LIMIT ? OFFSET ?",
                new Object[]{size, fromIndex},
                (rs, rowNum) -> {
                    Map<String, Object> job = new HashMap<>();
                    job.put("id", rs.getLong("id"));
                    job.put("title", rs.getString("title"));
                    job.put("companyName", rs.getString("company_name"));
                    job.put("location", rs.getString("location"));
                    job.put("salaryExtension", rs.getString("salary_extension"));
                    job.put("salaryUnit", rs.getString("salary_unit"));
                    job.put("experienceRequired", rs.getString("experience_required"));
                    job.put("educationRequired", rs.getString("education_required"));
                    String skillsStr = rs.getString("skills");
                    job.put("skills", skillsStr != null ? skillsStr.split(" ") : new String[0]);
                    job.put("welfareList", rs.getString("welfarelist"));
                    return job;
                }
            );
            
            Map<String, Object> data = new HashMap<>();
            data.put("jobs", jobs);
            data.put("totalCount", totalCount);
            data.put("currentPage", page);
            data.put("pageSize", size);
            data.put("totalPages", (int) Math.ceil((double) totalCount / size));
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "操作成功");
            response.put("data", data);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取岗位列表失败: " + e.getMessage());
            return ResponseEntity.ok(errorResponse);
        }
    }
    

    @PostMapping("/search")
    public ResponseEntity<JobPostingResponse> searchJobs(@RequestBody JobPostingResponse.JobSearchRequest request) {
        try {
            JobPostingResponse response = jobPostingService.searchJobs(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(JobPostingResponse.error("搜索岗位失败: " + e.getMessage()));
        }
    }
    

    @GetMapping("/{jobId}")
    public ResponseEntity<JobPostingResponse> getJobDetail(@PathVariable Long jobId) {
        try {
            JobPostingResponse response = jobPostingService.getJobDetail(jobId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(JobPostingResponse.error("获取岗位详情失败: " + e.getMessage()));
        }
    }
    

    @GetMapping("/popular")
    public ResponseEntity<JobPostingResponse> getPopularJobs(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            JobPostingResponse response = jobPostingService.getPopularJobs(limit);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(JobPostingResponse.error("获取热门岗位失败: " + e.getMessage()));
        }
    }
    

    @GetMapping("/latest")
    public ResponseEntity<JobPostingResponse> getLatestJobs(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            JobPostingResponse response = jobPostingService.getLatestJobs(limit);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(JobPostingResponse.error("获取最新岗位失败: " + e.getMessage()));
        }
    }
    

    @GetMapping("/health")
    public ResponseEntity<JobPostingResponse> healthCheck() {
        return ResponseEntity.ok(JobPostingResponse.success("岗位服务运行正常"));
    }
}
