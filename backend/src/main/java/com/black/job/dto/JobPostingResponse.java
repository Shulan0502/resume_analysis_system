package com.black.job.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobPostingResponse {
    
    private boolean success;
    private String message;
    private Object data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobDetail {
        private Long id;
        private String title;
        private String companyName;
        private Long companyId;
        private String department;
        private String location;
        private String jobType;
        private Integer salaryMin;
        private Integer salaryMax;
        private String salaryUnit;
        private String salaryExtension;
        private String salaryRange;
        private String experienceRequired;
        private String educationRequired;
        private String description;
        private String requirements;
        private String benefits;
        private String welfareList;
        private List<String> skills;
        private List<String> tags;
        private String contactPerson;
        private String contactPhone;
        private String contactEmail;
        private String status;
        private Integer priorityLevel;
        private Integer viewCount;
        private Integer applicationCount;
        private LocalDateTime deadline;
        private Boolean isUrgent;
        private Boolean isRemoteWork;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime publishedAt;
    }
    

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobListResponse {
        private List<JobDetail> jobs;
        private Integer totalCount;
        private Integer currentPage;
        private Integer pageSize;
        private Integer totalPages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobStatsResponse {
        private Integer totalJobs;
        private Integer activeJobs;
        private Integer pausedJobs;
        private Integer closedJobs;
        private Integer totalViews;
        private Integer totalApplications;
        private List<StatusStats> statusStats;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusStats {
        private String status;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateJobRequest {
        private String title;
        private String companyName;
        private Long companyId;
        private String department;
        private String location;
        private String jobType;
        private Integer salaryMin;
        private Integer salaryMax;
        private String salaryUnit;
        private String experienceRequired;
        private String educationRequired;
        private String description;
        private String requirements;
        private String benefits;
        private String skills; // 逗号分隔
        private String tags; // 逗号分隔
        private String contactPerson;
        private String contactPhone;
        private String contactEmail;
        private Integer priorityLevel;
        private LocalDateTime deadline;
        private Boolean isUrgent;
        private Boolean isRemoteWork;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateJobRequest {
        private String title;
        private String department;
        private String location;
        private String jobType;
        private Integer salaryMin;
        private Integer salaryMax;
        private String salaryUnit;
        private String experienceRequired;
        private String educationRequired;
        private String description;
        private String requirements;
        private String benefits;
        private String skills; // 逗号分隔
        private String tags; // 逗号分隔
        private String contactPerson;
        private String contactPhone;
        private String contactEmail;
        private String status;
        private Integer priorityLevel;
        private LocalDateTime deadline;
        private Boolean isUrgent;
        private Boolean isRemoteWork;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobSearchRequest {
        private String keyword;
        private String jobType;
        private String location;
        private Integer minSalary;
        private Integer maxSalary;
        private String experienceRequired;
        private String educationRequired;
        private Boolean isUrgent;
        private Boolean isRemoteWork;
        private String sortBy; // createdAt, salary, viewCount
        private String sortOrder; // asc, desc
        private Integer page;
        private Integer size;
    }

    public static JobPostingResponse success(Object data) {
        return JobPostingResponse.builder()
                .success(true)
                .message("操作成功")
                .data(data)
                .build();
    }
    
    public static JobPostingResponse success(String message, Object data) {
        return JobPostingResponse.builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static JobPostingResponse error(String message) {
        return JobPostingResponse.builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}
