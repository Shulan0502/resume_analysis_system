package com.black.job.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "job_postings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobPosting {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;
    
    @Column(name = "company_id")
    private Long companyId;
    
    @Column(name = "department", length = 100)
    private String department;
    
    @Column(name = "location", length = 200)
    private String location;
    
    @Column(name = "job_type", length = 50)
    private String jobType;
    
    @Column(name = "salary_min")
    private Integer salaryMin;
    
    @Column(name = "salary_max")
    private Integer salaryMax;
    
    @Column(name = "salary_unit", length = 20)
    private String salaryUnit;
    
    @Column(name = "salary_extension", length = 100)
    private String salaryExtension;
    
    @Column(name = "experience_required", length = 50)
    private String experienceRequired;
    
    @Column(name = "education_required", length = 50)
    private String educationRequired;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;
    
    @Column(name = "benefits", columnDefinition = "TEXT")
    private String benefits;
    
    @Column(name = "welfarelist", columnDefinition = "TEXT")
    private String welfareList;
    
    @Column(name = "skills", length = 500)
    private String skills;
    
    @Column(name = "tags", length = 500)
    private String tags;
    
    @Column(name = "contact_person", length = 100)
    private String contactPerson;
    
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;
    
    @Column(name = "contact_email", length = 100)
    private String contactEmail;
    
    @Column(name = "status", length = 20)
    private String status;
    
    @Column(name = "priority_level")
    private Integer priorityLevel;
    
    @Column(name = "view_count")
    private Integer viewCount;
    
    @Column(name = "application_count")
    private Integer applicationCount;
    
    @Column(name = "deadline")
    private LocalDateTime deadline;
    
    @Column(name = "is_urgent")
    private Boolean isUrgent;
    
    @Column(name = "is_remote_work")
    private Boolean isRemoteWork;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @OneToMany(mappedBy = "jobPosting", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<JobApplication> applications;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "active";
        }
        if (viewCount == null) {
            viewCount = 0;
        }
        if (applicationCount == null) {
            applicationCount = 0;
        }
        if (priorityLevel == null) {
            priorityLevel = 3;
        }
        if (isUrgent == null) {
            isUrgent = false;
        }
        if (isRemoteWork == null) {
            isRemoteWork = false;
        }
        if (salaryUnit == null) {
            salaryUnit = "月薪";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public String getSalaryRange() {
        if (salaryMin != null && salaryMax != null) {
            return salaryMin + "k-" + salaryMax + "k";
        } else if (salaryMin != null) {
            return salaryMin + "k起";
        } else if (salaryMax != null) {
            return "最高" + salaryMax + "k";
        }
        return "面议";
    }
    
    public String[] getSkillList() {
        if (skills != null && !skills.isEmpty()) {
            return skills.split(",");
        }
        return new String[0];
    }
    
    public String[] getTagList() {
        if (tags != null && !tags.isEmpty()) {
            return tags.split(",");
        }
        return new String[0];
    }
}
