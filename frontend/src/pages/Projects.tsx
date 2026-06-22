import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Upload, Modal, Form, Input, Select, message, Space, Popconfirm, Tag } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined, AuditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectAPI, templateAPI } from '../services/api';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, templatesRes] = await Promise.all([
        projectAPI.list(),
        templateAPI.list(),
      ]);
      setProjects(projectsRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (values: any) => {
    const formData = new FormData();
    formData.append('file', values.file.fileList[0].originFileObj);
    formData.append('name', values.name);
    formData.append('description', values.description || '');
    formData.append('template_id', values.template_id);

    try {
      await projectAPI.create(formData);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await projectAPI.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败');
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
      case 'completed': return '已审核';
      case 'in_progress': return '审核中';
      case 'failed': return '失败';
      default: return '待审核';
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '关联模板',
      dataIndex: 'template_id',
      key: 'template_id',
      render: (id: number) => {
        const template = templates.find(t => t.id === id);
        return template ? template.name : id;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<AuditOutlined />}
            onClick={() => navigate(`/audit?project_id=${record.id}`)}
          >
            审核
          </Button>
          <Popconfirm
            title="确定删除此项目?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="项目管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            创建项目
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="创建项目"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleUpload} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="template_id"
            label="关联模板"
            rules={[{ required: true, message: '请选择模板' }]}
          >
            <Select placeholder="请选择模板">
              {templates.map(template => (
                <Select.Option key={template.id} value={template.id}>
                  {template.name} (v{template.version})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="file"
            label="项目文件"
            rules={[{ required: true, message: '请上传文件' }]}
          >
            <Upload accept=".docx" maxCount={1} beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
