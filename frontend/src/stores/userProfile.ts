import { create } from 'zustand';

interface UserProfile {
  name: string;
  school: string;
  grade: string;
  major: string;
  phone: string;
  email: string;
  avatar: string;
  bio: string;
}

const defaultProfile: UserProfile = {
  name: '张三',
  school: '北京大学',
  grade: '大四',
  major: '计算机科学与技术',
  phone: '13800138000',
  email: 'zhangsan@example.com',
  avatar: '',
  bio: '计算机科学与技术专业在读学生，对人工智能和大数据方向感兴趣。',
};

export const useUserProfile = create<{
  profile: UserProfile;
  setProfile: (profile: Partial<UserProfile>) => void;
}>((set) => ({
  profile: defaultProfile,
  setProfile: (profile) =>
    set((state) => ({ profile: { ...state.profile, ...profile } })),
})); 