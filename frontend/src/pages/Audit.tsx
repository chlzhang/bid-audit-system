import React, { useState, useEffect } from 'react';
import { Card, Select, Button, message, Typography, Spin, Alert, Steps } from 'antd';
import { AuditOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projectAPI, auditAPI } from '../services/api';

const { Title, Paragraph } = Typography;

const AUDIT_STEPS = [
  { title: '解析文档' },
  { title: '对比分析' },
  { title: '合规检查' },
  { title: '生成报告' },
];

const Audit: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchProjects();
    const projectId = searchParams.get('project_id');
    if (projectId) {
      setSelectedProject(parseInt(projectId));
    }
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.list();
      setProjects(response.data);
    } catch (error) {
      message.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async () => {
    if (!selectedProject) {
      message.warning('请选择要审核的项目');
      return;
    }

    setAuditing(true);
    setCurrentStep(0);

    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 3) {
          clearInterval(stepTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 15000);

    try {
      const response = await auditAPI.start(selectedProject);
      clearInterval(stepTimer);
      setCurrentStep(4);
      message.success('审核完成');
      setTimeout(() => {
        navigate(`/audit-result/${response.data.audit_record.id}`);
      }, 500);
    } catch (error: any) {
      clearInterval(stepTimer);
      setCurrentStep(-1);
      message.error(error.response?.data?.detail || '审核失败');
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div>
      <Title level={4}>文件审核</Title>
      <Paragraph>
        选择要审核的项目，系统将自动对比项目文件与模板文件的差异，并进行智能审核。
      </Paragraph>

      <Card style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>选择项目</Title>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择要审核的项目"
            value={selectedProject}
            onChange={setSelectedProject}
            loading={loading}
            size="large"
          >
            {projects.map(project => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <Alert
          message="审核说明"
          description="系统将从以下几个方面进行审核：技术参数差异、设备选型变更、技术条款变更、合规性检查。审核完成后将生成详细的审核报告。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Button
          type="primary"
          size="large"
          icon={<AuditOutlined />}
          loading={auditing}
          onClick={handleAudit}
          disabled={!selectedProject}
          block
        >
          开始审核
        </Button>
      </Card>

      {auditing && (
        <Card style={{ marginTop: 24, textAlign: 'center' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16, marginBottom: 24 }}>
            正在进行智能审核，请稍候...
          </Paragraph>
          <Steps
            current={currentStep}
            size="small"
            items={AUDIT_STEPS.map((step, i) => ({
              ...step,
              status: i < currentStep ? 'finish' as const : i === currentStep ? 'process' as const : 'wait' as const,
            }))}
            style={{ maxWidth: 500, margin: '0 auto' }}
          />
        </Card>
      )}
    </div>
  );
};

export default Audit;
