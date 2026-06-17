import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../services/api'

type UserType = 'student' | 'school' | 'company'

interface UserInfo {
  id: number
  username: string
  realName: string
  email: string
  role: string
}

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  userType: UserType | null
  userInfo: UserInfo | null
  login: (username: string, password: string, userType: UserType) => Promise<{ success: boolean; message: string; redirectUrl?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
  setUserInfo: (userInfo: UserInfo) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      userType: null,
      userInfo: null,
      
      login: async (username: string, password: string, userType: UserType) => {
        try {
          const response = await apiLogin({ username, password, userType });
          
          if (response.success && response.token && response.userInfo) {
            // 保存token到localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('userInfo', JSON.stringify(response.userInfo));
            
            set({
              token: response.token,
              isAuthenticated: true,
              userType: userType,
              userInfo: response.userInfo
            });
            
            return {
              success: true,
              message: response.message,
              redirectUrl: response.redirectUrl
            };
          } else {
            return {
              success: false,
              message: response.message || '登录失败'
            };
          }
        } catch (error) {
          console.error('登录失败:', error);
          return {
            success: false,
            message: '网络错误，请重试'
          };
        }
      },
      
      logout: async () => {
        try {
          await apiLogout();
        } catch (error) {
          console.error('登出请求失败:', error);
        } finally {
          // 清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          
          set({
            token: null,
            isAuthenticated: false,
            userType: null,
            userInfo: null
          });
        }
      },
      
      checkAuth: async () => {
        const token = localStorage.getItem('token');
        const userInfoStr = localStorage.getItem('userInfo');
        
        if (!token || !userInfoStr) {
          return false;
        }
        
        try {
          // 验证token是否有效
          await getCurrentUser();
          const parsedUserInfo = JSON.parse(userInfoStr);
          
          set({
            token,
            isAuthenticated: true,
            userType: parsedUserInfo.role as UserType,
            userInfo: parsedUserInfo
          });
          
          return true;
        } catch (error) {
          console.error('验证token失败:', error);
          // token无效，清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          
          set({
            token: null,
            isAuthenticated: false,
            userType: null,
            userInfo: null
          });
          
          return false;
        }
      },
      
      setUserInfo: (userInfo: UserInfo) => {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        set({ userInfo });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        userType: state.userType,
        userInfo: state.userInfo
      })
    }
  )
) 