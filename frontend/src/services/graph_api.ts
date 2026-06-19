import axios from 'axios';

// 图谱服务专用 axios 实例，baseURL 走 Vite proxy 转发的路径
const graphApi = axios.create({
  baseURL: '/api/job-skill-graph',
  timeout: 60000, // LLM 简历解析可能需要更长时间
  headers: { 'Content-Type': 'application/json' },
});

// 复用全局 token 拦截器
graphApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== 类型定义 ====================

export interface GraphNode {
  id: string;
  label: string;
  type: 'Job' | 'Skill';
  category?: string | null;
  job_count?: number | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  importance: 'required' | 'preferred';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    job_nodes: number;
    skill_nodes: number;
  };
}

export interface GraphStats {
  nodes: { jobs: number; skills: number };
  relationships: { requires: number };
  popular_skills: Array<{ skill: string; job_count: number }>;
  skill_categories: Array<{ category: string; count: number }>;
}

export interface SearchResult {
  name: string;
  type: 'Job' | 'Skill';
}

export interface SkillAnalysis {
  skill: string;
  job_count: number;
  jobs: string[];
  company_count: number;
  companies: string[];
  related_skills: Array<{ skill: string; co_occurrence: number }>;
}

export interface JobAnalysis {
  job: string;
  skill_count: number;
  skills: Array<{ skill: string; category: string | null; importance: string }>;
  companies: string[];
}

export interface ResumeMatchData {
  matched_job: string;
  total_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  resume_skills: string[];
  matched_skills: Array<{ name: string; importance: string }>;
  missing_skills: Array<{ name: string; importance: string }>;
  required_skill_count: number;
  matched_required_count: number;
}

export interface RecommendJob {
  job: string;
  match_ratio: number;
  matched_skill_count: number;
  total_skill_count: number;
  shared_skills: string[];
}

// ==================== 查询接口（后端已有） ====================

export async function getGraphData(params?: {
  limit?: number;
  min_skill_count?: number;
}): Promise<GraphData> {
  const response = await graphApi.get('/graph-data', { params });
  return response.data.data;
}

export async function getGraphStats(): Promise<GraphStats> {
  const response = await graphApi.get('/stats');
  return response.data.data;
}

export async function searchGraph(query: string): Promise<SearchResult[]> {
  const response = await graphApi.get('/search', { params: { query } });
  return response.data.results || [];
}

export async function getSkillAnalysis(skillName: string): Promise<SkillAnalysis> {
  const response = await graphApi.get(`/skill-analysis/${encodeURIComponent(skillName)}`);
  return response.data.data;
}

export async function getJobAnalysis(jobName: string): Promise<JobAnalysis> {
  const response = await graphApi.get(`/job-analysis/${encodeURIComponent(jobName)}`);
  return response.data.data;
}

// ==================== 匹配接口（本次新增） ====================

export async function matchResume(payload: {
  target_job: string;
  resume_text: string;
}): Promise<ResumeMatchData> {
  const response = await graphApi.post('/match-resume', payload);
  if (!response.data.success) {
    throw new Error(response.data.message || '匹配失败');
  }
  return response.data.data;
}

export async function recommendJobs(
  skills: string[],
  limit = 10
): Promise<RecommendJob[]> {
  const response = await graphApi.get('/recommend-jobs', {
    params: { skills: skills.join(','), limit },
  });
  return response.data.data || [];
}

export interface TrendAnalysisData {
  popular_skills: Array<{ skill: string; job_count: number }>;
  skill_relations: Array<{ skill1: string; skill2: string; co_occurrence: number }>;
  emerging_jobs: Array<{ job_name: string; skills: string[]; common_jobs: number }>;
  summary: {
    total_skills: number;
    total_relations: number;
    emerging_count: number;
  };
}

export interface TrendAnalysisResponse {
  raw_data: TrendAnalysisData;
  ai_insight: string | null;
}

export interface TrendAnalysisResponse {
  raw_data: TrendAnalysisData;
  ai_insight: string | null;
}

export async function getTrendData(): Promise<TrendAnalysisData> {
  const response = await graphApi.get('/trend-data');
  if (!response.data.success) {
    throw new Error(response.data.message || '数据加载失败');
  }
  return response.data.data;
}

export async function getTrendInsight(): Promise<string> {
  const response = await graphApi.post('/trend-insight');
  if (!response.data.success) {
    throw new Error(response.data.message || 'AI 解读生成失败');
  }
  return response.data.data.ai_insight;
}

export async function getTrendAnalysis(includeAI = true): Promise<TrendAnalysisResponse> {
  const response = await graphApi.post('/trend-analysis', { include_ai_insight: includeAI });
  if (!response.data.success) {
    throw new Error(response.data.message || '趋势分析失败');
  }
  return response.data.data;
}
