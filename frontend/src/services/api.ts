import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api', // 使用Vite代理，在开发环境中会自动转发到后端
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关接口
export interface LoginRequest {
  username: string;
  password: string;
  userType: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  userInfo?: {
    id: number;
    username: string;
    realName: string;
    email: string;
    role: string;
  };
  redirectUrl?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  phone: string;
  realName: string;
  userType: string;
  // 学生扩展字段
  studentId?: string;
  schoolName?: string;
  major?: string;
  grade?: string;
  // 学校扩展字段
  schoolCode?: string;
  schoolType?: string;
  address?: string;
  website?: string;
  // 企业扩展字段
  companyCode?: string;
  industry?: string;
  companySize?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

// 登录接口
export const login = async (loginData: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', loginData);
    return response.data;
  } catch (error: any) {
    console.error('登录请求失败:', error);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/user');
    return response.data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

// 获取用户详细档案信息
export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('获取用户档案失败:', error);
    throw error;
  }
};

// 注册接口
export const register = async (registerData: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await api.post('/auth/register', registerData);
    return response.data;
  } catch (error: any) {
    console.error('注册请求失败:', error);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

// 登出接口
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('登出请求失败:', error);
    throw error;
  }
};

// 修改密码接口
export const changePassword = async (passwordData: {
  oldPassword: string;
  newPassword: string;
}) => {
  try {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  } catch (error: any) {
    console.error('修改密码失败:', error);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

// ==================== 简历投递相关API ====================

// 学生端：投递简历
export const applyForJob = async (applicationData: {
  jobId: number;
  resumeContent: string;
  coverLetter?: string;
}) => {
  try {
    const response = await api.post('/applications/apply', applicationData);
    return response.data;
  } catch (error: any) {
    console.error('简历投递失败:', error);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

// 学生端：获取我的申请记录
export const getMyApplications = async (page: number = 1, size: number = 10) => {
  try {
    const response = await api.get(`/applications/my-applications?page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    console.error('获取申请记录失败:', error);
    throw error;
  }
};

// 企业端：获取收到的简历申请
export const getReceivedApplications = async (page: number = 1, size: number = 10, status?: string) => {
  try {
    const url = `/applications/received?page=${page}&size=${size}${status ? `&status=${status}` : ''}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('获取简历申请失败:', error);
    throw error;
  }
};

// 企业端：处理简历申请
export const processApplication = async (applicationId: number, processData: {
  status: string;
  notes?: string;
}) => {
  try {
    const response = await api.put(`/applications/${applicationId}/process`, processData);
    return response.data;
  } catch (error: any) {
    console.error('处理申请失败:', error);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

// 企业端：获取申请统计
export const getApplicationStats = async () => {
  try {
    const response = await api.get('/applications/stats');
    return response.data;
  } catch (error) {
    console.error('获取申请统计失败:', error);
    throw error;
  }
};

// 文本对话接口
export const chatWithText = async (message: string) => {
  try {
    const response = await api.post('/chat/text', { message });
    return response.data;
  } catch (error) {
    console.error('文本对话请求失败:', error);
    throw error;
  }
};

// 语音对话接口
export const chatWithVoice = async (audioFile: File) => {
  try {
    const formData = new FormData();
    formData.append('audioFile', audioFile);
    const response = await api.post('/chat/voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 语音识别需要更长时间
    });
    return response.data;
  } catch (error) {
    console.error('语音对话请求失败:', error);
    throw error;
  }
};

// 上传简历文件
export const uploadResumeFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    // 修正：后端没有 /jianli/upload，但可以复用 /api/jianli/analyze 来处理文件
    // 我们将在 onFinish 中统一调用 analyzeResume
    // 因此这个函数可以暂时保留或用于独立的上传场景
    // 这里暂时指向一个正确的地址，尽管当前流程不直接用它
    const response = await api.post('/jianli/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('上传简历文件失败:', error);
    throw error;
  }
};

// 分析简历
export const analyzeResume = async (jobRequirements: string, resumeContent: string, fileId?: string) => {
  try {
    const payload = {
      Job_Requirements: jobRequirements,
      content: resumeContent,
      fileId: fileId, // 如果有文件ID，也一并发送
    };
    const response = await api.post('/jianli/analyze', payload);
    return response.data;
  } catch (error) {
    console.error('简历分析请求失败:', error);
    throw error;
  }
};


// 获取对话历史
export const getChatHistory = async () => {
  try {
    const response = await api.get('/chat/history');
    return response.data;
  } catch (error) {
    console.error('获取对话历史失败:', error);
    throw error;
  }
};

// 清除对话历史
export const clearChatHistory = async () => {
  try {
    const response = await api.delete('/chat/history');
    return response.data;
  } catch (error) {
    console.error('清除对话历史失败:', error);
    throw error;
  }
};

// 删除单条对话历史
export const deleteSingleChatHistory = async (id: number) => {
  try {
    const response = await api.delete(`/chat/history/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除单条对话历史失败:', error);
    throw error;
  }
};

// ==================== 学习资源相关API ====================

// 获取所有学习资源
export const getLearningResources = async (page: number = 1, size: number = 10) => {
  try {
    const response = await api.get(`/resources/all?page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    console.error('获取学习资源失败:', error);
    throw error;
  }
};

// 根据分类获取资源
export const getResourcesByCategory = async (category: string) => {
  try {
    const response = await api.get(`/resources/category/${encodeURIComponent(category)}`);
    return response.data;
  } catch (error) {
    console.error('获取分类资源失败:', error);
    throw error;
  }
};

// 根据类型获取资源
export const getResourcesByType = async (type: string) => {
  try {
    const response = await api.get(`/resources/type/${encodeURIComponent(type)}`);
    return response.data;
  } catch (error) {
    console.error('获取类型资源失败:', error);
    throw error;
  }
};

// 搜索资源
export const searchResources = async (keyword: string) => {
  try {
    const response = await api.get(`/resources/search?keyword=${encodeURIComponent(keyword)}`);
    return response.data;
  } catch (error) {
    console.error('搜索资源失败:', error);
    throw error;
  }
};

// 获取热门资源
export const getPopularResources = async (limit: number = 10) => {
  try {
    const response = await api.get(`/resources/popular?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('获取热门资源失败:', error);
    throw error;
  }
};

// 获取用户推荐资源
export const getUserRecommendations = async (userId: number, page: number = 1, size: number = 10) => {
  try {
    const response = await api.get(`/resources/recommendations?userId=${userId}&page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    console.error('获取推荐资源失败:', error);
    throw error;
  }
};

// 生成推荐
export const generateRecommendations = async (userId: number, interviewId: number) => {
  try {
    const response = await api.post(`/resources/recommendations/generate?userId=${userId}&interviewId=${interviewId}`);
    return response.data;
  } catch (error) {
    console.error('生成推荐失败:', error);
    throw error;
  }
};

// 获取资源统计
export const getResourceStats = async (userId: number) => {
  try {
    const response = await api.get(`/resources/stats?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('获取资源统计失败:', error);
    throw error;
  }
};

// 标记推荐为已查看
export const markRecommendationAsViewed = async (recommendationId: number) => {
  try {
    const response = await api.put(`/resources/recommendations/${recommendationId}/viewed`);
    return response.data;
  } catch (error) {
    console.error('标记推荐为已查看失败:', error);
    throw error;
  }
};

// 标记推荐为已完成
export const markRecommendationAsCompleted = async (recommendationId: number, rating?: number) => {
  try {
    const url = `/resources/recommendations/${recommendationId}/completed`;
    const params = rating ? `?rating=${rating}` : '';
    const response = await api.put(url + params);
    return response.data;
  } catch (error) {
    console.error('标记推荐为已完成失败:', error);
    throw error;
  }
};

// ==================== 资源收藏相关API ====================

// 添加收藏
export const addFavorite = async (userId: number, resourceId: number) => {
  try {
    const response = await api.post(`/resources/favorites?userId=${userId}&resourceId=${resourceId}`);
    return response.data;
  } catch (error) {
    console.error('添加收藏失败:', error);
    throw error;
  }
};

// 取消收藏
export const removeFavorite = async (userId: number, resourceId: number) => {
  try {
    const response = await api.delete(`/resources/favorites?userId=${userId}&resourceId=${resourceId}`);
    return response.data;
  } catch (error) {
    console.error('取消收藏失败:', error);
    throw error;
  }
};

// 【链路3】获取收藏列表 - 发起HTTP GET请求
export const getFavorites = async (userId: number, page: number = 1, size: number = 12) => {
  try {
    // 【链路3】向后端发送HTTP GET请求: /api/resources/favorites
    const response = await api.get(`/resources/favorites?userId=${userId}&page=${page}&size=${size}`);
    return response.data; // 【链路6】返回后端响应数据给前端
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    throw error;
  }
};

// 检查是否已收藏
export const checkFavorite = async (userId: number, resourceId: number) => {
  try {
    const response = await api.get(`/resources/favorites/check?userId=${userId}&resourceId=${resourceId}`);
    return response.data;
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    throw error;
  }
};

// ==================== 岗位发布相关API ====================

// 企业端：发布岗位
export const createJob = async (jobData: any) => {
  try {
    const response = await api.post('/jobs/create', jobData);
    return response.data;
  } catch (error) {
    console.error('发布岗位失败:', error);
    throw error;
  }
};

// 企业端：更新岗位
export const updateJob = async (jobId: number, jobData: any) => {
  try {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  } catch (error) {
    console.error('更新岗位失败:', error);
    throw error;
  }
};

// 企业端：删除岗位
export const deleteJob = async (jobId: number, companyId: number) => {
  try {
    const response = await api.delete(`/jobs/${jobId}?companyId=${companyId}`);
    return response.data;
  } catch (error) {
    console.error('删除岗位失败:', error);
    throw error;
  }
};

// 企业端：获取公司岗位
export const getCompanyJobs = async (companyId: number, page: number = 1, size: number = 10) => {
  try {
    const response = await api.get(`/jobs/company/${companyId}?page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    console.error('获取公司岗位失败:', error);
    throw error;
  }
};

// 企业端：获取公司岗位统计
export const getCompanyJobStats = async (companyId: number) => {
  try {
    const response = await api.get(`/jobs/company/${companyId}/stats`);
    return response.data;
  } catch (error) {
    console.error('获取岗位统计失败:', error);
    throw error;
  }
};

// 学生端：获取所有活跃岗位
export const getAllActiveJobs = async (page: number = 1, size: number = 12) => {
  try {
    const response = await api.get(`/jobs/active?page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    console.error('获取岗位列表失败:', error);
    throw error;
  }
};

// 学生端：搜索岗位
export const searchJobs = async (searchParams: any) => {
  try {
    const response = await api.post('/jobs/search', searchParams);
    return response.data;
  } catch (error) {
    console.error('搜索岗位失败:', error);
    throw error;
  }
};

// 通用：获取岗位详情
export const getJobDetail = async (jobId: number) => {
  try {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('获取岗位详情失败:', error);
    throw error;
  }
};

// 学生端：获取热门岗位
export const getPopularJobs = async (limit: number = 10) => {
  try {
    const response = await api.get(`/jobs/popular?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('获取热门岗位失败:', error);
    throw error;
  }
};

// 学生端：获取最新岗位
export const getLatestJobs = async (limit: number = 10) => {
  try {
    const response = await api.get(`/jobs/latest?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('获取最新岗位失败:', error);
    throw error;
  }
};

// 用户档案更新相关接口
export interface UpdateProfileRequest {
  realName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  // 学生相关字段
  studentId?: string;
  schoolName?: string;
  major?: string;
  grade?: string;
  graduationYear?: number;
  // 公司相关字段
  companyCode?: string;
  industry?: string;
  companySize?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  // 学校相关字段
  schoolCode?: string;
  schoolType?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
}

// 更新用户档案
export const updateProfile = async (profileData: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
  try {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  } catch (error: any) {
    console.error('更新用户档案失败:', error);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

// 头像上传相关接口
export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  fileName?: string;
  url?: string;
}

// 上传头像
export const uploadAvatar = async (file: File): Promise<UploadAvatarResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/files/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('上传头像失败:', error);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};