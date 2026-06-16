import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Descriptions, Button, message, Space, Divider } from 'antd';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
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
      const [recordRes, reportRes] = await Promise.all([
        auditAPI.getRecord(recordId),
        auditAPI.getReport(recordId),
      ]);
      setAuditResult(recordRes.data);
      setReport(reportRes.data.report);
    } catch (error) {
      message.error('获取审核结果失败');
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
  };

  const diffColumns = [
    {
      title: '序号',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '类型',
      dataIndex: 'diff_type',
      key: 'diff_type',
      render: (type: string) => getTypeText(type),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
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
    {
      title: '建议',
      dataIndex: 'suggestion',
      key: 'suggestion',
      ellipsis: true,
    },
  ];

  if (loading) {
    return <Card loading={loading} />;
  }

  if (!auditResult) {
    return <Card>审核记录不存在</Card>;
  }

  const differences = auditResult.differences || [];
  const highCount = differences.filter((d: any) => d.risk_level === 'high').length;
  const mediumCount = differences.filter((d: any) => d.risk_level === 'medium').length;
  const lowCount = differences.filter((d: any) => d.risk_level === 'low').length;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出报告
        </Button>
      </Space>

      <Title level={4}>审核结果</Title>

      <Card style={{ marginBottom: 24 }}>
        <Descriptions title="审核概要" bordered column={2}>
          <Descriptions.Item label="审核ID">{auditResult.id}</Descriptions.Item>
          <Descriptions.Item label="项目ID">{auditResult.project_id}</Descriptions.Item>
          <Descriptions.Item label="审核状态">
            <Tag color={auditResult.status === 'completed' ? 'success' : 'processing'}>
              {auditResult.status === 'completed' ? '已完成' : '审核中'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="总体风险等级">
            <Tag color={getRiskColor(auditResult.risk_level)}>
              {getRiskText(auditResult.risk_level)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="差异总数">{differences.length}</Descriptions.Item>
          <Descriptions.Item label="风险分布">
            <Space>
              <Tag color="red">高: {highCount}</Tag>
              <Tag color="orange">中: {mediumCount}</Tag>
              <Tag color="green">低: {lowCount}</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="审核时间" span={2}>
            {new Date(auditResult.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="完成时间" span={2}>
            {auditResult.completed_at
              ? new Date(auditResult.completed_at).toLocaleString()
              : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {auditResult.summary && (
        <Card title="审核摘要" style={{ marginBottom: 24 }}>
          <Paragraph>{auditResult.summary}</Paragraph>
        </Card>
      )}

      <Card title="详细差异清单">
        <Table
          columns={diffColumns}
          dataSource={differences}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: 16 }}>
                <p><strong>模板内容:</strong> {record.template_content || '-'}</p>
                <p><strong>项目内容:</strong> {record.project_content || '-'}</p>
                <p><strong>详细描述:</strong> {record.description || '-'}</p>
                <p><strong>修改建议:</strong> {record.suggestion || '-'}</p>
              </div>
            ),
          }}
        />
      </Card>

      <Card title="完整报告" style={{ marginTop: 24 }}>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16 }}>
          {report}
        </pre>
      </Card>
    </div>
  );
};

export default AuditResult;
