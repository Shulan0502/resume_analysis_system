import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, ConfigProvider, App as AntdApp } from 'antd'
import MainLayout from './layouts/MainLayout'
import CompanyLayout from './layouts/CompanyLayout'
import SchoolLayout from './layouts/SchoolLayout'
import Home from './pages/student/Home.tsx'
import Interview from './pages/student/Interview.tsx'
import Analysis from './pages/student/Analysis.tsx'
import Profile from './pages/student/Profile.tsx'
import QA from './pages/student/QA.tsx'
import Report from './pages/student/Report.tsx' // 个性化反馈报告页面
import ResumeAnalysis from './pages/student/ResumeAnalysis.tsx'; // 确保导入
import InterviewVideoAnalysis from './pages/student/InterviewVideoAnalysis.tsx'; // 面试视频分析页面
import MockInterviewQA from './pages/student/MockInterviewQA.tsx'; // 模拟问答面试页面
import MockInterviewRecord from './pages/student/MockInterviewRecord.tsx'; // 模拟面试录制页面
import Resources from './pages/student/Resources.tsx' // 学习资源页面
import Jobs from './pages/student/Jobs.tsx' // 招聘岗位页面
import KnowledgeGraphPage from './pages/student/KnowledgeGraphPage.tsx' // 岗位能力知识图谱页面
import JobMatchingPage from './pages/student/JobMatchingPage.tsx' // 人岗匹配页面
import Login from './pages/auth/Login.tsx'
import CompanyProfile from './pages/company/CompanyProfile.tsx'
import CompanyJobs from './pages/company/CompanyJobs.tsx'
import CompanyResumes from './pages/company/CompanyResumes.tsx'
import CompanyInterviews from './pages/company/CompanyInterviews.tsx'
import JobList from './pages/student/JobList.tsx'
import FormalInterview from './pages/student/FormalInterview.tsx'
import SchoolLogin from './pages/school/SchoolLogin.tsx'
import SchoolDashboard from './pages/school/SchoolDashboard.tsx'
import SchoolProfile from './pages/school/SchoolProfile.tsx'
import Register from './pages/auth/Register.tsx'
import ForgotPassword from './pages/auth/ForgotPassword.tsx'
import { useAuthStore } from './stores/auth'
import zhCN from 'antd/locale/zh_CN'
import './index.css'

const { Content } = Layout

// 路由保护组件
const ProtectedRoute = ({ children, userType }: { children: React.ReactNode; userType: string }) => {
  const { isAuthenticated, userType: currentUserType } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (userType && currentUserType !== userType) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/school/login" element={<SchoolLogin />} />
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* 学校管理路由 */}
          <Route
            path="/school/dashboard"
            element={
              <ProtectedRoute userType="school">
                <SchoolLayout>
                  <SchoolDashboard />
                </SchoolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/school/profile"
            element={
              <ProtectedRoute userType="school">
                <SchoolLayout>
                  <SchoolProfile />
                </SchoolLayout>
              </ProtectedRoute>
            }
          />
          
          {/* 学生路由 */}
          <Route
            path="/home"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <Home />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-list"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <JobList />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/dashboard"
            element={
              <ProtectedRoute userType="company">
                <CompanyLayout>
                  <CompanyJobs />
                </CompanyLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <ProtectedRoute userType="company">
                <CompanyLayout>
                  <CompanyProfile />
                </CompanyLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company"
            element={
              <ProtectedRoute userType="company">
                <Navigate to="/company/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/resumes"
            element={
              <ProtectedRoute userType="company">
                <CompanyLayout>
                  <Content className="p-6">
                    <CompanyResumes />
                  </Content>
                </CompanyLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/interviews"
            element={
              <ProtectedRoute userType="company">
                <CompanyLayout>
                  <Content className="p-6">
                    <CompanyInterviews />
                  </Content>
                </CompanyLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <Interview />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <Analysis />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:id"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <Report />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <Profile />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/qa"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <QA />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <Resources />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <Jobs />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview-video-analysis"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <InterviewVideoAnalysis />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interview-qa"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <MockInterviewQA />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interview-record"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <MockInterviewRecord />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-analysis"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <ResumeAnalysis />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/formal-interview"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <FormalInterview />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <QA mode="history" />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-graph"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <KnowledgeGraphPage />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-matching"
            element={
              <ProtectedRoute userType="student">
                <MainLayout>
                  <Content className="p-6">
                    <JobMatchingPage />
                  </Content>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App