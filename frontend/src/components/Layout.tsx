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

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const contentStyle: React.CSSProperties = {
    margin: '24px 16px',
    padding: 24,
    background: '#fff',
    borderRadius: 8,
    minHeight: 280,
    animation: 'fadeIn 0.3s ease-in',
  };

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
