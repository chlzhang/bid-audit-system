# 前端 UI 增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强 Dashboard 数据可视化、审核报告对比视图、全局交互动效。

**Architecture:** 新增 `@ant-design/charts` 依赖，修改 5 个现有文件。三个模块独立并行实现。

**Tech Stack:** React 18, Ant Design 5, @ant-design/pro-components, @ant-design/charts, dayjs

---

## Task 1: 安装 @ant-design/charts 依赖

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: 修改 package.json**

```bash
cd frontend && npm install @ant-design/charts@^2.1.0
```

- [ ] **Step 2: 提交**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: add @ant-design/charts for data visualization"
```

---

## Task 2: Dashboard 增强 — 图表 + 动态数字

**Covers:** [S2]

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: 替换整个 Dashboard.tsx**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Skeleton } from 'antd';
import {
  FileTextOutlined,
  ProjectOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined,
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
            title="完成率"
            value={stats.audits ? Math.round((stats.completed / stats.audits) * 100) : 0}
            prefix={<CheckCircleOutlined />}
            color="#52c41a"
            loading={loading}
            suffix="%"
          />
          {/* Override suffix support by handling outside AnimatedStatistic */}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card
            title="风险分布"
            loading={loading}
            bodyStyle={{ padding: '12px 0' }}
          >
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
          <Card
            title="审核状态"
            loading={loading}
            bodyStyle={{ padding: '12px 24px' }}
          >
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
```

- [ ] **Step 2: 验证编译**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: add charts and animated statistics to dashboard"
```

---

## Task 3: AuditResult 增强 — 对比视图 + 风险环图

**Covers:** [S3]

**Files:**
- Modify: `frontend/src/pages/AuditResult.tsx`

- [ ] **Step 1: 替换整个 AuditResult.tsx**

```tsx
import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, message, Space, Divider,
  Spin, Breadcrumb, Skeleton, Tooltip, Row, Col,
} from 'antd';
import {
  DownloadOutlined, ArrowLeftOutlined, CopyOutlined,
  HomeOutlined, FileSearchOutlined,
} from '@ant-design/icons';
import { RingProgress } from '@ant-design/charts';
import { useParams, useNavigate } from 'react-router-dom';
import { auditAPI } from '../services/api';

const { Title, Paragraph, Text } = Typography;

const AuditResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [auditResult, setAuditResult] = useState<any>(null);
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchAuditResult(parseInt(id));
    }
  }, [id]);

  const fetchAuditResult = async (recordId: number) => {
    setLoading(true);
    try {
      const reportRes = await auditAPI.getReport(recordId);
      setReport(reportRes.data.report);
      const recordRes = await auditAPI.getRecord(recordId);
      setAuditResult(recordRes.data);
    } catch (error) {
      message.error('获取审核结果失败');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return level;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'param_diff': return '参数差异';
      case 'equipment_change': return '设备变更';
      case 'clause_change': return '条款变更';
      case 'compliance_issue': return '合规问题';
      default: return type;
    }
  };

  const handleExport = () => {
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `审核报告_${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('报告已下载');
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(report).then(() => {
      message.success('报告已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const diffColumns = [
    {
      title: '#',
      key: 'index',
      width: 40,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '类型',
      dataIndex: 'diff_type',
      key: 'diff_type',
      width: 100,
      render: (type: string) => <Tag>{getTypeText(type)}</Tag>,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      ellipsis: true,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      ellipsis: true,
    },
    {
      title: '风险',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 85,
      render: (level: string) => (
        <Tag color={getRiskColor(level)}>{getRiskText(level)}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 16 }} />
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
        <Card style={{ marginTop: 24 }}>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  if (!auditResult) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Title level={4}>审核记录不存在</Title>
          <Paragraph type="secondary">该审核记录可能已被删除或ID不正确</Paragraph>
          <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
            返回工作台
          </Button>
        </div>
      </Card>
    );
  }

  const differences = auditResult.differences || [];
  const highCount = differences.filter((d: any) => d.risk_level === 'high').length;
  const mediumCount = differences.filter((d: any) => d.risk_level === 'medium').length;
  const lowCount = differences.filter((d: any) => d.risk_level === 'low').length;
  const total = differences.length;

  const ringConfig = {
    percent: total > 0 ? highCount / total : 0,
    color: ['#ff4d4f', '#faad14', '#52c41a'],
    innerRadius: 0.8,
    statistic: {
      title: false,
      content: {
        style: { fontSize: 20, fontWeight: 'bold' },
        content: highCount.toString(),
      },
    },
    height: 180,
    width: 180,
  };

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <><HomeOutlined /> 工作台</>, onClick: () => navigate('/') },
          { title: <><FileSearchOutlined /> 审核结果 #{id}</> },
        ]}
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bodyStyle={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
              {total}
            </div>
            <div style={{ color: '#999', marginTop: 4 }}>差异总数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bodyStyle={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
              {highCount}
            </div>
            <div style={{ color: '#999', marginTop: 4 }}>高风险</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bodyStyle={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>
              {mediumCount}
            </div>
            <div style={{ color: '#999', marginTop: 4 }}>中风险</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bodyStyle={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
              {lowCount}
            </div>
            <div style={{ color: '#999', marginTop: 4 }}>低风险</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="审核概要" size="small">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RingProgress {...ringConfig} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, color: '#999' }}>
              高风险占比
            </div>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="基本信息" size="small">
            <Row gutter={[8, 12]}>
              <Col span={8}><Text type="secondary">审核ID</Text><br /><Text strong>{auditResult.id}</Text></Col>
              <Col span={8}><Text type="secondary">项目ID</Text><br /><Text strong>{auditResult.project_id}</Text></Col>
              <Col span={8}>
                <Text type="secondary">状态</Text><br />
                <Tag color={auditResult.status === 'completed' ? 'success' : 'processing'}>
                  {auditResult.status === 'completed' ? '已完成' : '审核中'}
                </Tag>
              </Col>
              <Col span={8}>
                <Text type="secondary">总体风险</Text><br />
                <Tag color={getRiskColor(auditResult.risk_level)}>
                  {getRiskText(auditResult.risk_level)}
                </Tag>
              </Col>
              <Col span={8}><Text type="secondary">创建时间</Text><br /><Text>{new Date(auditResult.created_at).toLocaleString()}</Text></Col>
              <Col span={8}>
                <Text type="secondary">完成时间</Text><br />
                <Text>{auditResult.completed_at ? new Date(auditResult.completed_at).toLocaleString() : '-'}</Text>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出报告
        </Button>
        <Tooltip title="复制完整报告">
          <Button icon={<CopyOutlined />} onClick={handleCopyReport}>复制报告</Button>
        </Tooltip>
      </Space>

      {auditResult.summary && (
        <Card title="审核摘要" style={{ marginBottom: 24 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{auditResult.summary}</Paragraph>
        </Card>
      )}

      <Card title="详细差异清单">
        <Table
          columns={diffColumns}
          dataSource={differences}
          rowKey="id"
          size="small"
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '8px 16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{
                      background: '#e6f7ff',
                      borderLeft: '3px solid #1890ff',
                      padding: '8px 12px',
                      borderRadius: 4,
                      minHeight: 60,
                    }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>模板内容</Text>
                      <Paragraph style={{ marginBottom: 0, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                        {record.template_content || '-'}
                      </Paragraph>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{
                      background: '#f6ffed',
                      borderLeft: '3px solid #52c41a',
                      padding: '8px 12px',
                      borderRadius: 4,
                      minHeight: 60,
                    }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>项目内容</Text>
                      <Paragraph style={{ marginBottom: 0, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                        {record.project_content || '-'}
                      </Paragraph>
                    </div>
                  </Col>
                </Row>
                {record.description && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>详细描述</Text>
                    <Paragraph style={{ marginBottom: 4 }}>{record.description}</Paragraph>
                  </div>
                )}
                {record.suggestion && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>修改建议</Text>
                    <Paragraph style={{ marginBottom: 0, color: '#faad14' }}>
                      {record.suggestion}
                    </Paragraph>
                  </div>
                )}
              </div>
            ),
          }}
        />
      </Card>

      <Divider />

      <Card
        title="完整报告"
        extra={
          <Space>
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopyReport}>复制</Button>
            <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={handleExport}>下载</Button>
          </Space>
        }
      >
        <pre style={{
          whiteSpace: 'pre-wrap',
          background: '#fafafa',
          padding: 16,
          borderRadius: 6,
          fontSize: 13,
          maxHeight: 500,
          overflow: 'auto',
          border: '1px solid #f0f0f0',
          lineHeight: 1.6,
        }}>
          {report.split('\n').map((line, i) => {
            let color = 'inherit';
            if (line.includes('HIGH') || line.includes('高风险')) color = '#ff4d4f';
            else if (line.includes('MEDIUM') || line.includes('中风险')) color = '#faad14';
            else if (line.includes('LOW') || line.includes('低风险')) color = '#52c41a';
            return <div key={i} style={{ color }}>{line || '\u00A0'}</div>;
          })}
        </pre>
      </Card>
    </div>
  );
};

export default AuditResult;
```

- [ ] **Step 2: 验证编译**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/AuditResult.tsx
git commit -m "feat: enhance audit result with risk ring chart, diff view, breadcrumb"
```

---

## Task 4: 全局交互增强 — 骨架屏 + 审核进度 + 过渡动画

**Covers:** [S4]

**Files:**
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Audit.tsx`

- [ ] **Step 1: 修改 Layout.tsx — 页面过渡动画**

```tsx
import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  ProjectOutlined,
  AuditOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const contentStyle: React.CSSProperties = {
  margin: '24px 16px',
  padding: 24,
  background: '#fff',
  borderRadius: 8,
  minHeight: 280,
  animation: 'fadeIn 0.3s ease-in',
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/templates',
      icon: <FileTextOutlined />,
      label: '模板管理',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/audit',
      icon: <AuditOutlined />,
      label: '文件审核',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? '审核' : '招标文件审核'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname === '/' ? '/' : location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            zIndex: 1,
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}>
              用户
            </Button>
          </Dropdown>
        </Header>
        <Content style={contentStyle}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
```

- [ ] **Step 2: 修改 index.tsx — 全局动画 CSS**

在 `frontend/src/index.tsx` 添加全局样式（在 ErrorBoundary 外层）：

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .audit-step-active {
    animation: pulse 1.5s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

- [ ] **Step 3: 修改 Audit.tsx — 审核进度 Steps**

```tsx
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
              status: i < currentStep ? 'finish' : i === currentStep ? 'process' : 'wait',
            }))}
            style={{ maxWidth: 500, margin: '0 auto' }}
          />
        </Card>
      )}
    </div>
  );
};

export default Audit;
```

- [ ] **Step 4: 修改 Login.tsx — 登录成功通知**

在 `Login.tsx` 的 `onFinish` 中，将 `message.success('登录成功')` 改为 `notification.success`：

```tsx
// 在文件顶部添加 notification 导入
import { Form, Input, Button, Card, message, notification, Typography } from 'antd';

// 在 onFinish 中替换:
notification.success({
  message: '登录成功',
  description: '欢迎使用招标技术文件审核系统',
  placement: 'topRight',
  duration: 2,
});
```

- [ ] **Step 5: 验证编译**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add frontend/src/components/Layout.tsx frontend/src/pages/Login.tsx frontend/src/pages/Audit.tsx frontend/src/index.tsx
git commit -m "feat: add page transitions, audit progress steps, skeleton loading, and notification"
```

---

## 验证清单

1. **编译验证：** `cd frontend && npx tsc --noEmit` 零错误
2. **构建验证：** `cd frontend && npm run build` 编译成功
3. **Docker 部署：** `docker-compose up -d --build frontend` 成功
4. **功能验证：**
   - 工作台：饼图/柱状图正常显示，数字递增动画
   - 审核报告：风险环图、左右对比视图、复制按钮
   - Audit 页面：审批进度 Steps 动画
   - 全局：页面切换淡入动画、骨架屏加载

---

## 文件变更汇总

| 文件 | 操作 |
|------|------|
| `frontend/package.json` | 新增依赖 `@ant-design/charts` |
| `frontend/src/pages/Dashboard.tsx` | 重写 — 图表 + 动画数字 |
| `frontend/src/pages/AuditResult.tsx` | 重写 — 对比视图 + 风险环图 |
| `frontend/src/components/Layout.tsx` | 修改 — 过渡动画 + 阴影 |
| `frontend/src/pages/Login.tsx` | 修改 — 登录通知 |
| `frontend/src/pages/Audit.tsx` | 修改 — Steps 进度 |
| `frontend/src/index.tsx` | 修改 — 全局 CSS 动画 |
