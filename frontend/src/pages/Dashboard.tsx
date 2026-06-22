import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Skeleton } from 'antd';
import {
  FileTextOutlined,
  ProjectOutlined,
  AuditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Pie, Column } from '@ant-design/charts';
import { useNavigate } from 'react-router-dom';
import { templateAPI, projectAPI, auditAPI } from '../services/api';

const { Title } = Typography;

function useCountUp(end: number, duration: number = 800) {
  const [val, setVal] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    let start = 0;
    const step = () => {
      start += 1;
      setVal(Math.min(Math.round((start / (duration / 16)) * end), end));
      if (start < duration / 16) {
        raf.current = requestAnimationFrame(step);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [end, duration]);

  return val;
}

const AnimatedStatistic: React.FC<{
  title: string;
  value: number;
  prefix: React.ReactNode;
  color?: string;
  loading?: boolean;
}> = ({ title, value, prefix, color, loading }) => {
  const animated = useCountUp(value);
  return (
    <Card>
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <Statistic
          title={title}
          value={animated}
          prefix={prefix}
          valueStyle={{ color }}
        />
      )}
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    templates: 0,
    projects: 0,
    audits: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
  });
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, projectsRes, auditsRes] = await Promise.all([
        templateAPI.list(),
        projectAPI.list(),
        auditAPI.listRecords(),
      ]);

      const audits = auditsRes.data;
      setStats({
        templates: templatesRes.data.length,
        projects: projectsRes.data.length,
        audits: audits.length,
        completed: audits.filter((a: any) => a.status === 'completed').length,
        failed: audits.filter((a: any) => a.status === 'failed').length,
        inProgress: audits.filter((a: any) => a.status === 'in_progress').length,
        highRisk: audits.filter((a: any) => a.risk_level === 'high').length,
        mediumRisk: audits.filter((a: any) => a.risk_level === 'medium').length,
        lowRisk: audits.filter((a: any) => a.risk_level === 'low').length,
      });

      setRecentAudits(audits.slice(0, 5));
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '审核中';
      case 'failed': return '失败';
      default: return '待处理';
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return level || '-';
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '项目ID',
      dataIndex: 'project_id',
      key: 'project_id',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 80,
      render: (level: string) =>
        level ? <Tag color={getRiskColor(level)}>{getRiskText(level)}</Tag> : '-',
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <a onClick={() => navigate(`/audit-result/${record.id}`)}>查看详情</a>
      ),
    },
  ];

  const riskPieData = [
    { type: '高风险', value: stats.highRisk },
    { type: '中风险', value: stats.mediumRisk },
    { type: '低风险', value: stats.lowRisk },
  ].filter(d => d.value > 0);

  const statusColumnData = [
    { status: '已完成', count: stats.completed },
    { status: '审核中', count: stats.inProgress },
    { status: '失败', count: stats.failed },
  ];

  const pieConfig = {
    data: riskPieData,
    angleField: 'value',
    colorField: 'type',
    color: ['#ff4d4f', '#faad14', '#52c41a'],
    radius: 0.8,
    autoFit: true,
    label: {
      type: 'outer' as const,
      content: '{name} {percentage}',
    },
    legend: {
      position: 'bottom' as const,
    },
    height: 220,
  };

  const columnConfig = {
    data: statusColumnData,
    xField: 'status',
    yField: 'count',
    color: ['#52c41a', '#1890ff', '#ff4d4f'],
    autoFit: true,
    label: {
      position: 'top' as const,
    },
    height: 220,
  };

  return (
    <div>
      <Title level={4}>工作台</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <AnimatedStatistic
            title="模板数量"
            value={stats.templates}
            prefix={<FileTextOutlined />}
            color="#1890ff"
            loading={loading}
          />
        </Col>
        <Col span={6}>
          <AnimatedStatistic
            title="项目数量"
            value={stats.projects}
            prefix={<ProjectOutlined />}
            color="#722ed1"
            loading={loading}
          />
        </Col>
        <Col span={6}>
          <AnimatedStatistic
            title="审核总数"
            value={stats.audits}
            prefix={<AuditOutlined />}
            color="#13c2c2"
            loading={loading}
          />
        </Col>
        <Col span={6}>
          <AnimatedStatistic
            title="完成率 (%)"
            value={stats.audits ? Math.round((stats.completed / stats.audits) * 100) : 0}
            prefix={<CheckCircleOutlined />}
            color="#52c41a"
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="风险分布" loading={loading} bodyStyle={{ padding: '12px 0' }}>
            {riskPieData.length > 0 ? (
              <Pie {...pieConfig} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无审核数据
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="审核状态" loading={loading} bodyStyle={{ padding: '12px 24px' }}>
            <Column {...columnConfig} />
          </Card>
        </Col>
      </Row>

      <Card title="最近审核记录">
        <Table
          columns={columns}
          dataSource={recentAudits}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
