import axios from 'axios';

const jobApi = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

jobApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CompanyJob {
  id: number;
  title: string;
  companyName: string;
  location: string;
  salaryRange: string;
  experienceRequired: string;
  educationRequired: string;
  skills: string[];
  welfareList: string;
}

export interface JobSearchResponse {
  jobs: CompanyJob[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export async function searchJobs(keyword: string, page = 1, size = 10): Promise<JobSearchResponse> {
  const response = await jobApi.post('/jobs/search', { keyword, page, size });
  return response.data.data;
}
