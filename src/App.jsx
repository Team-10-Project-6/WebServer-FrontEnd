import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Avatar, Dropdown, Card, Space, Button, Spin, Result } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import Feed from "./components/Feed";
import Profile from './components/Profile';
import PostDetail from './components/PostDetail';

const { Header, Content } = Layout;

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithRedirect, logout, isLoading, isAuthenticated, getAccessTokenSilently, user, error } = useAuth0();
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    if (isAuthenticated) {
      callProtectedEndpoint();
      // Only redirect to /feed from root
      if (location.pathname === '/') {
        navigate('/feed');
      }
    }
  }, [isAuthenticated, location.pathname]);

  const callProtectedEndpoint = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setData(response.data);
    } catch (error) {
      console.error('Error calling protected endpoint:', error);
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        position: 'fixed',
        top: 0,
        zIndex: 1000,
        width: '100%'
      }}>
        <div 
          style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff', cursor: 'pointer' }}
          onClick={() => navigate('/feed')}
        >
          Photo Sharing App
        </div>
        
        {/* Show Login button or Profile dropdown based on auth state */}
        {isAuthenticated ? (
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
        ) : (
          <Button 
            type="primary" 
            icon={<LoginOutlined />}
            onClick={() => loginWithRedirect()}
          >
            Log In
          </Button>
        )}
      </Header>

      <Content style={{ marginTop: '64px', height: 'calc(100vh - 64px)', overflow: 'auto', background: '#f0f2f5' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
          <Routes>
            <Route 
              path="/" 
              element={
                <Feed 
                  posts={posts} 
                  setPosts={setPosts} 
                  user={user}
                  data={data}
                  isAuthenticated={isAuthenticated}
                />
              } 
            />
            <Route 
              path="/feed" 
              element={
                <Feed 
                  posts={posts} 
                  setPosts={setPosts} 
                  user={user}
                  data={data}
                  isAuthenticated={isAuthenticated}
                />
              } 
            />
            <Route 
              path="/post/:postId" 
              element={<PostDetail isAuthenticated={isAuthenticated} />} 
            />
            <Route 
              path="/profile" 
              element={
                isAuthenticated ? (
                  <Card>
                    <Profile />
                  </Card>
                ) : (
                  <Card>
                    <Result
                      status="403"
                      title="Please Log In"
                      subTitle="You need to be logged in to view your profile."
                      extra={
                        <Button type="primary" onClick={() => loginWithRedirect()}>
                          Log In
                        </Button>
                      }
                    />
                  </Card>
                )
              } 
            />
            <Route 
              path="/settings" 
              element={
                isAuthenticated ? (
                  <Card>
                    <h2>Settings</h2>
                    <p>Settings page coming soon...</p>
                  </Card>
                ) : (
                  <Card>
                    <Result
                      status="403"
                      title="Please Log In"
                      subTitle="You need to be logged in to access settings."
                      extra={
                        <Button type="primary" onClick={() => loginWithRedirect()}>
                          Log In
                        </Button>
                      }
                    />
                  </Card>
                )
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