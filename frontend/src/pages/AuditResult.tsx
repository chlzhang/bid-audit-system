import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, message, Space, Divider,
  Breadcrumb, Skeleton, Tooltip, Row, Col,
} from 'antd';
import {
  DownloadOutlined, ArrowLeftOutlined, CopyOutlined,
  HomeOutlined, FileSearchOutlined,
} from '@ant-design/icons';
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
              <svg width="180" height="180" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="72" fill="none" stroke="#f0f0f0" strokeWidth="24" />
                {total > 0 && (
                  <>
                    <circle cx="90" cy="90" r="72" fill="none" stroke="#ff4d4f"
                      strokeWidth="24" strokeDasharray={`${(highCount / total) * 452.4} 452.4`}
                      strokeLinecap="round" transform="rotate(-90 90 90)" />
                    <circle cx="90" cy="90" r="72" fill="none" stroke="#faad14"
                      strokeWidth="24" strokeDasharray={`${(mediumCount / total) * 452.4} 452.4`}
                      strokeLinecap="round" transform="rotate(-90 90 90)"
                      strokeDashoffset={-(highCount / total) * 452.4} />
                    <circle cx="90" cy="90" r="72" fill="none" stroke="#52c41a"
                      strokeWidth="24" strokeDasharray={`${(lowCount / total) * 452.4} 452.4`}
                      strokeLinecap="round" transform="rotate(-90 90 90)"
                      strokeDashoffset={-((highCount + mediumCount) / total) * 452.4} />
                  </>
                )}
                <text x="90" y="85" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#ff4d4f">
                  {highCount}
                </text>
                <text x="90" y="108" textAnchor="middle" fontSize="12" fill="#999">高风险</text>
              </svg>
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
