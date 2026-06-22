import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Skeleton, Popconfirm, message } from 'antd';
import {
  FileTextOutlined,
  ProjectOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { templateAPI, projectAPI, auditAPI } from '../services/api';

const { Title } = Typography;

const COLORS = { high: '#ff4d4f', medium: '#faad14', low: '#52c41a' };

function SimplePie({ data }: { data: { type: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 80;
  const cx = 120;
  const cy = 100;
  let cum = 0;

  const arcs = data.map((d, i) => {
    const startAngle = (cum / total) * 2 * Math.PI - Math.PI / 2;
    cum += d.value;
    const endAngle = (cum / total) * 2 * Math.PI - Math.PI / 2;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const color = COLORS[d.type === '高风险' ? 'high' : d.type === '中风险' ? 'medium' : 'low'];

    const midAngle = (startAngle + endAngle) / 2;
    const lx = cx + (r + 20) * Math.cos(midAngle);
    const ly = cy + (r + 20) * Math.sin(midAngle);
    const pct = Math.round((d.value / total) * 100);

    return (
      <g key={d.type}>
        <path
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={color}
        />
        <text x={lx} y={ly} textAnchor={lx > cx ? 'start' : 'end'} fontSize={12} fill={color}>
          {d.type} {pct}%
        </text>
      </g>
    );
  });

  return (
    <svg viewBox="0 0 240 200" width="100%" height={200}>
      {arcs}
    </svg>
  );
}

function SimpleColumn({ data }: { data: { status: string; count: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const barW = 50;
  const h = 160;
  const colors: Record<string, string> = { '已完成': '#52c41a', '审核中': '#1890ff', '失败': '#ff4d4f' };

  return (
    <svg viewBox="0 0 300 200" width="100%" height={200}>
      {data.map((d, i) => {
        const barH = (d.count / maxVal) * h;
        const x = 30 + i * 100;
        const y = 180 - barH;
        return (
          <g key={d.status}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={colors[d.status] || '#999'} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={14} fontWeight="bold" fill={colors[d.status]}>
              {d.count}
            </text>
            <text x={x + barW / 2} y={196} textAnchor="middle" fontSize={12} fill="#666">
              {d.status}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

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

  const handleDelete = async (id: number) => {
    try {
      await auditAPI.delete(id);
      message.success('删除成功');
      fetchData();
    } catch {
      message.error('删除失败');
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
      width: 150,
      render: (_: any, record: any) => (
        <>
          <a onClick={() => navigate(`/audit-result/${record.id}`)}>详情</a>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <a style={{ color: '#ff4d4f', marginLeft: 12 }}>删除</a>
          </Popconfirm>
        </>
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
          <Card
            title="风险分布"
            loading={loading}
            bodyStyle={{ padding: '12px 0' }}
            extra={
              <div style={{ fontSize: 12, color: '#999' }}>
                高{stats.highRisk} 中{stats.mediumRisk} 低{stats.lowRisk}
              </div>
            }
          >
            {riskPieData.length > 0 ? (
              <SimplePie data={riskPieData} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无审核数据
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="审核状态" loading={loading} bodyStyle={{ padding: '12px 24px' }}>
            <SimpleColumn data={statusColumnData} />
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
