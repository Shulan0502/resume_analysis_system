import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  message,
  Tabs,
  List,
  Switch,
  Typography,
  Avatar,
  Spin,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  UploadOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useUserProfile } from '@/stores/userProfile.ts'
import { useLocation, useNavigate } from 'react-router-dom'
import { updateProfile, UpdateProfileRequest, getUserProfile, uploadAvatar } from '@/services/api.ts'

const { Title } = Typography
const { TabPane } = Tabs

const Profile = () => {
  const { profile, setProfile } = useUserProfile()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const fromJobList = new URLSearchParams(location.search).get('from') === 'joblist'

  useEffect(() => {
    form.setFieldsValue(profile)
  }, [profile, form])

  useEffect(() => {
    // 获取用户信息
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const userProfile = await getUserProfile()
      if (userProfile) {
        // 根据用户角色映射数据
        const updatedProfile = {
          name: userProfile.realName || profile.name,
          email: userProfile.email || profile.email,
          phone: userProfile.phone || profile.phone,
          school: userProfile.schoolName || profile.school,
          grade: userProfile.grade || profile.grade,
          major: userProfile.major || profile.major,
          // 头像处理：如果后端有头像信息，构建完整URL
          avatar: userProfile.avatar ? `/api/files/avatar/${userProfile.avatar}` : profile.avatar,
          bio: profile.bio,
        }
        setProfile(updatedProfile)
        form.setFieldsValue(updatedProfile)
      }
    } catch (error) {
      console.error('获取用户档案失败:', error)
      // 不显示错误消息，保持默认数据
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      setLoading(true)
      const response = await uploadAvatar(file)

      if (response.success) {
        // 更新头像显示
        const newAvatarUrl = response.url || `/api/files/avatar/${response.fileName}`
        const updatedProfile = {
          ...profile,
          avatar: newAvatarUrl
        }
        setProfile(updatedProfile)
        message.success(response.message || '头像上传成功')
      } else {
        message.error(response.message || '头像上传失败')
      }
    } catch (error) {
      console.error('头像上传失败:', error)
      message.error('头像上传失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (values: any) => {
    setLoading(true)
    try {
      // 构建更新请求数据
      const updateData: UpdateProfileRequest = {
        realName: values.name,
        email: values.email,
        phone: values.phone,
        bio: values.bio,
        // 学生相关字段
        schoolName: values.school,
        major: values.major,
        grade: values.grade,
      }

      const response = await updateProfile(updateData)

      if (response.success) {
        // 更新本地状态
        setProfile(values)
        message.success(response.message || '个人信息更新成功')
      } else {
        message.error(response.message || '更新失败')
      }
    } catch (error) {
      console.error('更新个人信息失败:', error)
      message.error('更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const notificationSettings = [
    {
      title: '面试提醒',
      description: '在面试开始前30分钟发送提醒',
      key: 'interview_reminder',
    },
    {
      title: '分析报告',
      description: '面试完成后发送分析报告',
      key: 'analysis_report',
    },
    {
      title: '学习建议',
      description: '定期发送个性化学习建议',
      key: 'learning_suggestions',
    },
  ]

  return (
    <div className="space-y-6">
      <Title level={2}>个人中心</Title>

      <Tabs defaultActiveKey="profile">
        <TabPane
          tab={
            <span>
              <UserOutlined />
              个人信息
            </span>
          }
          key="profile"
        >
          <Card>
            <Spin spinning={loading}>
              <div className="flex items-start space-x-6">
                <div className="text-center">
                  <Avatar
                    size={100}
                    icon={<UserOutlined />}
                    src={profile.avatar}
                    className="mb-4"
                  />
                  <Upload
                    name="avatar"
                    listType="picture"
                    maxCount={1}
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      // 验证文件类型
                      const isImage = file.type.startsWith('image/');
                      if (!isImage) {
                        message.error('只能上传图片文件!');
                        return false;
                      }

                      // 验证文件大小 (5MB)
                      const isLt5M = file.size / 1024 / 1024 < 5;
                      if (!isLt5M) {
                        message.error('图片大小不能超过5MB!');
                        return false;
                      }

                      // 调用上传函数
                      handleAvatarUpload(file);
                      return false; // 阻止默认上传行为
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={loading}>
                      更换头像
                    </Button>
                  </Upload>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  initialValues={profile}
                  onFinish={handleProfileUpdate}
                  className="flex-1"
                >
                <Form.Item
                  name="name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1\d{10}$/, message: '请输入有效的手机号' },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="school"
                  label="学历"
                  rules={[{ required: true, message: '请输入学历' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="experience"
                  label="工作经验"
                  rules={[{ required: true, message: '请输入工作经验' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="grade"
                  label="年级"
                  rules={[{ required: true, message: '请输入年级' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="major"
                  label="专业"
                  rules={[{ required: true, message: '请输入专业' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item name="bio" label="个人简介">
                  <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存修改
                    </Button>
                    {fromJobList && (
                      <Button type="primary" onClick={() => navigate('/jobs', { state: { showConfirmModal: true } })}>
                        返回招聘流程
                      </Button>
                    )}
                  </div>
                </Form.Item>
                              </Form>
              </div>
            </Spin>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SettingOutlined />
              系统设置
            </span>
          }
          key="settings"
        >
          <Card title="通知设置">
            <List
              itemLayout="horizontal"
              dataSource={notificationSettings}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Switch
                      defaultChecked
                      onChange={(checked) => {
                        message.success(
                          `${item.title}已${checked ? '开启' : '关闭'}`,
                        )
                      }}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="隐私设置" className="mt-4">
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  title: '面试视频存储',
                  description: '允许系统存储面试视频用于后续分析',
                },
                {
                  title: '数据共享',
                  description: '允许匿名数据用于系统改进',
                },
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Switch
                      defaultChecked
                      onChange={(checked) => {
                        message.success(
                          `${item.title}已${checked ? '开启' : '关闭'}`,
                        )
                      }}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <LockOutlined />
              修改密码
            </span>
          }
          key="security"
        >
          <Card>
            <Form layout="vertical">
              <Form.Item
                label="修改密码"
                name="oldPassword"
                rules={[{ required: true, message: '请输入原密码' }]}
              >
                <Input.Password placeholder="请输入原密码" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码长度不能小于8位' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请确认新密码" />
              </Form.Item>

              <Form.Item>
                <Button type="primary">更新密码</Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Profile