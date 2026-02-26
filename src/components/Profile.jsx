import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Post from './Post';
import { Spin, Divider, Empty, message, Button, Space, Input } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const Profile = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [username, setUsername] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const observerRef = useRef(null);
  const lastPostRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyPosts(true);
      fetchUserName();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Set up intersection observer for infinite scroll
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreRef.current && !fetchingMore) {
        fetchMyPosts(false);
      }
    });

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [userPosts, fetchingMore]);

  const fetchMyPosts = async (reset = false) => {
    if (fetchingMore) return;
    
    setFetchingMore(true);
    if (reset) setLoadingPosts(true);

    try {
      const page = reset ? 1 : pageRef.current;
      console.log("Fetching my posts - page:", page);
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/posts/me?page=${page}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const postsData = response.data;

      if (reset) {
        setUserPosts(postsData);
        pageRef.current = 2;
      } else {
        setUserPosts(prev => [...prev, ...postsData]);
        pageRef.current += 1;
      }

      // If we got less than 20 posts, there are no more
      hasMoreRef.current = postsData.length === 20;

    } catch (err) {
      console.error("Error fetching user posts:", err);
      message.error("Failed to load posts");
    } finally {
      setLoadingPosts(false);
      setFetchingMore(false);
    }
  };

  const fetchUserName = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsername(response.data.username);
    } catch (error) {
      console.error('Error calling backend user endpoint for username:', error);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newName.trim() || newName === username) {
      setIsEditingName(false);
      return;
    }

    setIsUpdatingName(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
      });

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/username`,
        { username: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsername(newName);
      message.success("Username updated!");
      setIsEditingName(false);
    } catch (error) {
      console.error(error);
      message.error("Failed to update username");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handlePostDeleted = () => {
    // Refresh posts after deletion
    pageRef.current = 1;
    hasMoreRef.current = true;
    fetchMyPosts(true);
  };

  const handleLike = (postId) => {
    setUserPosts(posts => posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked }
        : post
    ));
  };

  if (isLoading) {
    return <div className="loading-text">Loading profile...</div>;
  }

  return (
    isAuthenticated && user ? ( 
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', 
        maxWidth: '600px', margin: '0 auto', width: '100%'}}>
        {/* Profile Header */}
        <img 
          src={user.picture || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 110 110'%3E%3Ccircle cx='55' cy='55' r='55' fill='%2363b3ed'/%3E%3Cpath d='M55 50c8.28 0 15-6.72 15-15s-6.72-15-15-15-15 6.72-15 15 6.72 15 15 15zm0 7.5c-10 0-30 5.02-30 15v3.75c0 2.07 1.68 3.75 3.75 3.75h52.5c2.07 0 3.75-1.68 3.75-3.75V72.5c0-9.98-20-15-30-15z' fill='%23fff'/%3E%3C/svg%3E`} 
          alt={user.name || 'User'} 
          className="profile-picture"
          style={{ 
            width: '110px', 
            height: '110px', 
            borderRadius: '50%', 
            objectFit: 'cover',
            border: '3px solid #63b3ed'
          }}
          onError={(e) => {
            const target = e.target;
            target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 110 110'%3E%3Ccircle cx='55' cy='55' r='55' fill='%2363b3ed'/%3E%3Cpath d='M55 50c8.28 0 15-6.72 15-15s-6.72-15-15-15-15 6.72-15 15 6.72 15 15 15zm0 7.5c-10 0-30 5.02-30 15v3.75c0 2.07 1.68 3.75 3.75 3.75h52.5c2.07 0 3.75-1.68 3.75-3.75V72.5c0-9.98-20-15-30-15z' fill='%23fff'/%3E%3C/svg%3E`;
          }}
        />
        <div style={{ textAlign: 'center' }}>
          {isEditingName ? (
            <Space direction="vertical">
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new username"
                style={{ fontSize: '1.2rem', textAlign: 'center' }}
              />
              <Space>
                <Button 
                  type="primary" 
                  onClick={handleUpdateUsername} 
                  loading={isUpdatingName}
                >
                  Save
                </Button>
                <Button onClick={() => setIsEditingName(false)}>Cancel</Button>
              </Space>
            </Space>
          ) : (
            <div 
              className="profile-name" 
              style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', cursor: 'pointer' }}
              onClick={() => {
                setNewName(username);
                setIsEditingName(true);
              }}
            >
              {username || user.name} <EditOutlined style={{ fontSize: '1rem', color: '#1890ff' }} />
            </div>
          )}
          <div className="profile-email" style={{ fontSize: '1.15rem', color: '#666' }}>
            {user.email}
          </div>
        </div>
        
        <Divider>My Posts</Divider>

        {/* Posts List */}
        {loadingPosts && userPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
          </div>
        ) : userPosts.length === 0 ? (
          <Empty 
            description="You haven't posted anything yet"
            style={{ padding: '48px 0' }}
          />
        ) : (
          <>
            {userPosts.map((post, index) => (
              <div 
                key={post.id}
                ref={index === userPosts.length - 1 ? lastPostRef : null}
                style={{ width: '100%' }}
              >
                <Post 
                  post={post} 
                  onLike={handleLike}
                  onPostDeleted={handlePostDeleted}
                  clickable={true}
                  isAuthenticated={isAuthenticated}
                  currentUsername={username}
                />
              </div>
            ))}

            {/* Loading more indicator */}
            {fetchingMore && hasMoreRef.current && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin />
                <div style={{ marginTop: '8px', color: '#666' }}>Loading more posts...</div>
              </div>
            )}

            {/* End of posts message */}
            {!hasMoreRef.current && userPosts.length > 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px 0',
                color: '#999',
                fontSize: '14px'
              }}>
                You've reached the end
              </div>
            )}
          </>
        )}
      </div>
    ) : null
  );
};

export default Profile;