import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout, Avatar, Dropdown, Card, Space, Button, Spin, Result } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, LoginOutlined, HomeOutlined } from '@ant-design/icons';
import Feed from "./components/Feed";
import Profile from './components/Profile';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import ContinueButton from './components/ContinueButton';

const { Header, Content } = Layout;

function AppContent() {
  const navigate = useNavigate();
  const { loginWithRedirect, logout, isLoading, isAuthenticated, getAccessTokenSilently, user, error } = useAuth0();
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  
  console.log('AUDIENCE CHECK:', import.meta.env.VITE_AUTH0_AUDIENCE);

  useEffect(() => {
    if (isAuthenticated) {
      callProtectedEndpoint();
      navigate('/feed');
    }
  }, [isAuthenticated]);

  const callProtectedEndpoint = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });
      
      console.log('Token:', token);
      console.log('Token segments:', token.split('.').length);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error calling protected endpoint:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Status:', error.response.status);
      } else if (error.request) {
        console.error('No response received');
      }
    }
  };

  const profileMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }) => {
    console.log('Menu clicked:', key);
    
    switch(key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        logout({ logoutParams: { returnTo: window.location.origin } });
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <div style={{ fontSize: '16px', color: '#666' }}>Loading...</div>
        </Space>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Result
          status="error"
          title="Oops!"
          subTitle="Something went wrong"
          extra={<div>{error.message}</div>}
        />
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
            Photo Sharing App
          </div>
          <Button 
            type="primary" 
            icon={<LoginOutlined />}
            onClick={() => loginWithRedirect()}
          >
            Sign In
          </Button>
        </Header>
        
        <Content style={{ 
          padding: '48px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Card style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <img 
                src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png" 
                alt="Auth0 Logo" 
                style={{ maxWidth: '200px', margin: '0 auto' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 style={{ fontSize: '24px', margin: 0 }}>Welcome to Photo Sharing App!</h1>
              <p style={{ color: '#666' }}>Get started by signing in to your account</p>
              <LoginButton />
            </Space>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div 
          style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff', cursor: 'pointer' }}
          onClick={() => navigate('/feed')}
        >
          Photo Sharing App
        </div>
        
        <Dropdown
          menu={{ items: profileMenuItems, onClick: handleMenuClick }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Avatar 
            size="large" 
            src={user?.picture}
            icon={!user?.picture && <UserOutlined />}
            style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
          />
        </Dropdown>
      </Header>

      <Content style={{ padding: '24px 0', background: '#f0f2f5' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px' }}>
          <Routes>
            <Route 
              path="/feed" 
              element={
                <Feed 
                  posts={posts} 
                  setPosts={setPosts} 
                  user={user}
                  data={data}
                />
              } 
            />
            <Route 
              path="/profile" 
              element={
                <Card>
                  <Profile />
                </Card>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <Card>
                  <h2>Settings</h2>
                  <p>Settings page coming soon...</p>
                </Card>
              } 
            />
          </Routes>
        </div>
      </Content>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;