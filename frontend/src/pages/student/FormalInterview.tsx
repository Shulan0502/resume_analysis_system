import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const FormalInterview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // 从路由 state 获取岗位信息
  const jobTitle = location.state?.jobTitle;
  const company = location.state?.company;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
      <Card className="w-full max-w-2xl shadow-lg rounded-2xl">
        <Title level={2}>正式面试</Title>
        <Paragraph>欢迎来到正式面试环节，请根据页面提示完成面试。</Paragraph>
        {jobTitle && company && (
          <div className="mb-4">
            <div><b>岗位：</b>{jobTitle}</div>
            <div><b>公司：</b>{company}</div>
          </div>
        )}
        <Button type="primary" onClick={() => navigate('/jobs')}>返回岗位列表</Button>
      </Card>
    </div>
  );
};

export default FormalInterview; 