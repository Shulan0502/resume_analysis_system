package com.black.job.service;

import com.black.job.dto.JobPostingResponse;
import com.black.job.entity.JobPosting;
import com.black.job.repository.JobPostingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JobPostingService {
    
    @Autowired
    private JobPostingRepository jobPostingRepository;
    

    @Transactional
    public JobPostingResponse createJob(JobPostingResponse.CreateJobRequest request) {
        try {
            JobPosting jobPosting = JobPosting.builder()
                    .title(request.getTitle())
                    .companyName(request.getCompanyName())
                    .companyId(request.getCompanyId())
                    .department(request.getDepartment())
                    .location(request.getLocation())
                    .jobType(request.getJobType())
                    .salaryMin(request.getSalaryMin())
                    .salaryMax(request.getSalaryMax())
                    .salaryUnit(request.getSalaryUnit())
                    .experienceRequired(request.getExperienceRequired())
                    .educationRequired(request.getEducationRequired())
                    .description(request.getDescription())
                    .requirements(request.getRequirements())
                    .benefits(request.getBenefits())
                    .skills(request.getSkills())
                    .tags(request.getTags())
                    .contactPerson(request.getContactPerson())
                    .contactPhone(request.getContactPhone())
                    .contactEmail(request.getContactEmail())
                    .priorityLevel(request.getPriorityLevel())
                    .deadline(request.getDeadline())
                    .isUrgent(request.getIsUrgent())
                    .isRemoteWork(request.getIsRemoteWork())
                    .publishedAt(LocalDateTime.now())
                    .build();
            
            JobPosting savedJob = jobPostingRepository.save(jobPosting);
            return JobPostingResponse.success("岗位发布成功", convertToJobDetail(savedJob));
        } catch (Exception e) {
            return JobPostingResponse.error("岗位发布失败: " + e.getMessage());
        }
    }

    @Transactional
    public JobPostingResponse updateJob(Long jobId, JobPostingResponse.UpdateJobRequest request) {
        try {
            Optional<JobPosting> jobOpt = jobPostingRepository.findById(jobId);
            if (!jobOpt.isPresent()) {
                return JobPostingResponse.error("岗位不存在");
            }
            
            JobPosting jobPosting = jobOpt.get();

            if (request.getTitle() != null) jobPosting.setTitle(request.getTitle());
            if (request.getDepartment() != null) jobPosting.setDepartment(request.getDepartment());
            if (request.getLocation() != null) jobPosting.setLocation(request.getLocation());
            if (request.getJobType() != null) jobPosting.setJobType(request.getJobType());
            if (request.getSalaryMin() != null) jobPosting.setSalaryMin(request.getSalaryMin());
            if (request.getSalaryMax() != null) jobPosting.setSalaryMax(request.getSalaryMax());
            if (request.getSalaryUnit() != null) jobPosting.setSalaryUnit(request.getSalaryUnit());
            if (request.getExperienceRequired() != null) jobPosting.setExperienceRequired(request.getExperienceRequired());
            if (request.getEducationRequired() != null) jobPosting.setEducationRequired(request.getEducationRequired());
            if (request.getDescription() != null) jobPosting.setDescription(request.getDescription());
            if (request.getRequirements() != null) jobPosting.setRequirements(request.getRequirements());
            if (request.getBenefits() != null) jobPosting.setBenefits(request.getBenefits());
            if (request.getSkills() != null) jobPosting.setSkills(request.getSkills());
            if (request.getTags() != null) jobPosting.setTags(request.getTags());
            if (request.getContactPerson() != null) jobPosting.setContactPerson(request.getContactPerson());
            if (request.getContactPhone() != null) jobPosting.setContactPhone(request.getContactPhone());
            if (request.getContactEmail() != null) jobPosting.setContactEmail(request.getContactEmail());
            if (request.getStatus() != null) jobPosting.setStatus(request.getStatus());
            if (request.getPriorityLevel() != null) jobPosting.setPriorityLevel(request.getPriorityLevel());
            if (request.getDeadline() != null) jobPosting.setDeadline(request.getDeadline());
            if (request.getIsUrgent() != null) jobPosting.setIsUrgent(request.getIsUrgent());
            if (request.getIsRemoteWork() != null) jobPosting.setIsRemoteWork(request.getIsRemoteWork());
            
            JobPosting updatedJob = jobPostingRepository.save(jobPosting);
            return JobPostingResponse.success("岗位更新成功", convertToJobDetail(updatedJob));
        } catch (Exception e) {
            return JobPostingResponse.error("岗位更新失败: " + e.getMessage());
        }
    }

    public JobPostingResponse getAllActiveJobs(int page, int size) {
        try {
            List<JobPosting> allJobs = jobPostingRepository.findAll();
            int totalCount = allJobs.size();
            int fromIndex = (page - 1) * size;
            int toIndex = Math.min(fromIndex + size, totalCount);
            
            List<JobPosting> pageJobs = fromIndex < totalCount ? allJobs.subList(fromIndex, toIndex) : new ArrayList<>();
            
            List<JobPostingResponse.JobDetail> jobs = pageJobs.stream()
                    .map(this::convertToJobDetail)
                    .collect(Collectors.toList());
            
            JobPostingResponse.JobListResponse response = JobPostingResponse.JobListResponse.builder()
                    .jobs(jobs)
                    .totalCount(totalCount)
                    .currentPage(page)
                    .pageSize(size)
                    .totalPages((int) Math.ceil((double) totalCount / size))
                    .build();
            
            return JobPostingResponse.success(response);
        } catch (Exception e) {
            return JobPostingResponse.error("获取岗位列表失败: " + e.getMessage());
        }
    }

    public JobPostingResponse getCompanyJobs(Long companyId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page - 1, size);
            Page<JobPosting> jobPage = jobPostingRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, "active", pageable);
            
            List<JobPostingResponse.JobDetail> jobs = jobPage.getContent().stream()
                    .map(this::convertToJobDetail)
                    .collect(Collectors.toList());
            
            JobPostingResponse.JobListResponse response = JobPostingResponse.JobListResponse.builder()
                    .jobs(jobs)
                    .totalCount((int) jobPage.getTotalElements())
                    .currentPage(page)
                    .pageSize(size)
                    .totalPages(jobPage.getTotalPages())
                    .build();
            
            return JobPostingResponse.success(response);
        } catch (Exception e) {
            return JobPostingResponse.error("获取公司岗位失败: " + e.getMessage());
        }
    }

    public JobPostingResponse searchJobs(JobPostingResponse.JobSearchRequest request) {
        try {
            int page = request.getPage() != null ? request.getPage() : 1;
            int size = request.getSize() != null ? request.getSize() : 10;
            Pageable pageable = PageRequest.of(page - 1, size);
            
            Page<JobPosting> jobPage = jobPostingRepository.findJobsWithFilters(
                    "active",
                    request.getJobType(),
                    request.getLocation(),
                    request.getMinSalary(),
                    request.getMaxSalary(),
                    request.getKeyword(),
                    pageable
            );
            
            List<JobPostingResponse.JobDetail> jobs = jobPage.getContent().stream()
                    .map(this::convertToJobDetail)
                    .collect(Collectors.toList());
            
            JobPostingResponse.JobListResponse response = JobPostingResponse.JobListResponse.builder()
                    .jobs(jobs)
                    .totalCount((int) jobPage.getTotalElements())
                    .currentPage(page)
                    .pageSize(size)
                    .totalPages(jobPage.getTotalPages())
                    .build();
            
            return JobPostingResponse.success(response);
        } catch (Exception e) {
            return JobPostingResponse.error("搜索岗位失败: " + e.getMessage());
        }
    }

    public JobPostingResponse getJobDetail(Long jobId) {
        try {
            Optional<JobPosting> jobOpt = jobPostingRepository.findById(jobId);
            if (!jobOpt.isPresent()) {
                return JobPostingResponse.error("岗位不存在");
            }
            
            JobPosting jobPosting = jobOpt.get();

            jobPosting.setViewCount(jobPosting.getViewCount() + 1);
            jobPostingRepository.save(jobPosting);
            
            return JobPostingResponse.success(convertToJobDetail(jobPosting));
        } catch (Exception e) {
            return JobPostingResponse.error("获取岗位详情失败: " + e.getMessage());
        }
    }

    public JobPostingResponse getPopularJobs(int limit) {
        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<JobPosting> jobs = jobPostingRepository.findPopularJobs("active", pageable);
            
            List<JobPostingResponse.JobDetail> jobDetails = jobs.stream()
                    .map(this::convertToJobDetail)
                    .collect(Collectors.toList());
            
            return JobPostingResponse.success(jobDetails);
        } catch (Exception e) {
            return JobPostingResponse.error("获取热门岗位失败: " + e.getMessage());
        }
    }

    public JobPostingResponse getLatestJobs(int limit) {
        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<JobPosting> jobs = jobPostingRepository.findLatestJobs("active", pageable);
            
            List<JobPostingResponse.JobDetail> jobDetails = jobs.stream()
                    .map(this::convertToJobDetail)
                    .collect(Collectors.toList());
            
            return JobPostingResponse.success(jobDetails);
        } catch (Exception e) {
            return JobPostingResponse.error("获取最新岗位失败: " + e.getMessage());
        }
    }

    public JobPostingResponse getCompanyJobStats(Long companyId) {
        try {
            Long totalJobs = jobPostingRepository.countByCompanyIdAndStatus(companyId, "active");
            Long pausedJobs = jobPostingRepository.countByCompanyIdAndStatus(companyId, "paused");
            Long closedJobs = jobPostingRepository.countByCompanyIdAndStatus(companyId, "closed");
            
            List<Object[]> statusData = jobPostingRepository.countByCompanyIdGroupByStatus(companyId);
            List<JobPostingResponse.StatusStats> statusStats = statusData.stream()
                    .map(data -> JobPostingResponse.StatusStats.builder()
                            .status((String) data[0])
                            .count((Long) data[1])
                            .build())
                    .collect(Collectors.toList());
            
            JobPostingResponse.JobStatsResponse stats = JobPostingResponse.JobStatsResponse.builder()
                    .totalJobs(totalJobs.intValue())
                    .activeJobs(totalJobs.intValue())
                    .pausedJobs(pausedJobs.intValue())
                    .closedJobs(closedJobs.intValue())
                    .statusStats(statusStats)
                    .build();
            
            return JobPostingResponse.success(stats);
        } catch (Exception e) {
            return JobPostingResponse.error("获取统计数据失败: " + e.getMessage());
        }
    }

    @Transactional
    public JobPostingResponse deleteJob(Long jobId, Long companyId) {
        try {
            Optional<JobPosting> jobOpt = jobPostingRepository.findById(jobId);
            if (!jobOpt.isPresent()) {
                return JobPostingResponse.error("岗位不存在");
            }
            
            JobPosting jobPosting = jobOpt.get();
            if (!jobPosting.getCompanyId().equals(companyId)) {
                return JobPostingResponse.error("无权限删除此岗位");
            }
            
            jobPostingRepository.delete(jobPosting);
            return JobPostingResponse.success("岗位删除成功");
        } catch (Exception e) {
            return JobPostingResponse.error("岗位删除失败: " + e.getMessage());
        }
    }

    private JobPostingResponse.JobDetail convertToJobDetail(JobPosting jobPosting) {
        List<String> skills = jobPosting.getSkills() != null ? 
                Arrays.asList(jobPosting.getSkills().split(",")) : new ArrayList<>();
        List<String> tags = jobPosting.getTags() != null ? 
                Arrays.asList(jobPosting.getTags().split(",")) : new ArrayList<>();
        
        return JobPostingResponse.JobDetail.builder()
                .id(jobPosting.getId())
                .title(jobPosting.getTitle())
                .companyName(jobPosting.getCompanyName())
                .companyId(jobPosting.getCompanyId())
                .department(jobPosting.getDepartment())
                .location(jobPosting.getLocation())
                .jobType(jobPosting.getJobType())
                .salaryMin(jobPosting.getSalaryMin())
                .salaryMax(jobPosting.getSalaryMax())
                .salaryUnit(jobPosting.getSalaryUnit())
                .salaryExtension(jobPosting.getSalaryExtension())
                .salaryRange(jobPosting.getSalaryRange())
                .experienceRequired(jobPosting.getExperienceRequired())
                .educationRequired(jobPosting.getEducationRequired())
                .description(jobPosting.getDescription())
                .requirements(jobPosting.getRequirements())
                .benefits(jobPosting.getBenefits())
                .welfareList(jobPosting.getWelfareList())
                .skills(skills)
                .tags(tags)
                .contactPerson(jobPosting.getContactPerson())
                .contactPhone(jobPosting.getContactPhone())
                .contactEmail(jobPosting.getContactEmail())
                .status(jobPosting.getStatus())
                .priorityLevel(jobPosting.getPriorityLevel())
                .viewCount(jobPosting.getViewCount())
                .applicationCount(jobPosting.getApplicationCount())
                .deadline(jobPosting.getDeadline())
                .isUrgent(jobPosting.getIsUrgent())
                .isRemoteWork(jobPosting.getIsRemoteWork())
                .createdAt(jobPosting.getCreatedAt())
                .updatedAt(jobPosting.getUpdatedAt())
                .publishedAt(jobPosting.getPublishedAt())
                .build();
    }
}
