import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Upload, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { templateAPI } from '../services/api';

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await templateAPI.list();
      setTemplates(response.data);
    } catch (error) {
      message.error('获取模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (values: any) => {
    const formData = new FormData();
    formData.append('file', values.file.fileList[0].originFileObj);
    formData.append('name', values.name);
    formData.append('description', values.description || '');
    formData.append('version', values.version || '1.0');

    try {
      await templateAPI.create(formData);
      message.success('上传成功');
      setModalVisible(false);
      form.resetFields();
      fetchTemplates();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '上传失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await templateAPI.delete(id);
      message.success('删除成功');
      fetchTemplates();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
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
          <Popconfirm
            title="确定删除此模板?"
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
        title="模板管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            上传模板
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="上传模板"
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
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="version" label="版本" initialValue="1.0">
            <Input placeholder="请输入版本号" />
          </Form.Item>
          <Form.Item
            name="file"
            label="模板文件"
            rules={[{ required: true, message: '请上传文件' }]}
          >
            <Upload accept=".docx" maxCount={1} beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              上传
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Templates;
