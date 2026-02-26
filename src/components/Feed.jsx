import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Input, Button, Space, Avatar, Empty, Upload, message, Spin } from 'antd';
import { UserOutlined, PictureOutlined } from '@ant-design/icons';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import Post from './Post';

const { TextArea, Search } = Input;

// Helper function to convert file to base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const [prefix, base64Data] = reader.result.split(",");
      const mimeType = prefix.match(/:(.*?);/)[1];
      resolve({
        base64Data,
        mimeType,
        fileName: file.name
      });
    };
    reader.onerror = (err) => reject(err);
  });
};

// Helper function to validate image file
const validateImageFile = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('You can only upload image files!');
    return false;
  }

  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('Image must be smaller than 5MB!');
    return false;
  }

  return true;
};

// Helper function to create image preview
const createImagePreview = (file, setImagePreview) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    setImagePreview(e.target.result);
  };
  reader.readAsDataURL(file);
};

function Feed({ posts, setPosts, user, isAuthenticated  }) {
  const [newPostContent, setNewPostContent] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { getAccessTokenSilently } = useAuth0();
  const [fetchingMore, _setFetchingMore] = useState(false);
  const fetchingMoreRef = useRef(false);
  const [isSearching, setIsSearching] = useState(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const observerRef = useRef(null);
  const lastPostRef = useRef(null);
  const searchPageRef = useRef(1);
  const searchQueryRef = useRef('');

  const setFetchingMore = (val) => {
    fetchingMoreRef.current = val;
    _setFetchingMore(val);
  };

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const fetchPosts = async (reset = false) => {
    if (fetchingMoreRef.current) return;

    setFetchingMore(true);
    if (reset) setLoading(true);

    try {
      const page = reset ? 1 : pageRef.current;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts?page=${page}`);

      const postsData = response.data;
      if (reset) {
        setPosts(postsData);
        pageRef.current = 2;
      } else {
        setPosts(prev => [...prev, ...postsData]);
        pageRef.current += 1;
      }

      hasMoreRef.current = postsData.length === 20;

    } catch (err) {
      console.error("Error fetching posts:", err);
      message.error("Failed to fetch posts");
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const handleSearch = useCallback(async (value, reset = true) => {
    if (fetchingMoreRef.current) return;

    if (!value.trim()) {
      searchQueryRef.current = '';
      pageRef.current = 1;
      hasMoreRef.current = true;
      fetchPosts(true);
      return;
    }

    if (reset) {
      searchQueryRef.current = value;
      searchPageRef.current = 1;
      setIsSearching(true);
    }

    setFetchingMore(true);
    hasMoreRef.current = false;

    try {
      const page = reset ? 1 : searchPageRef.current;
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/posts/search`, {
        query: value,
        page: page,
      });

      if (reset) {
        setPosts(response.data);
      } else {
        setPosts(prev => [...prev, ...response.data]);
      }

      hasMoreRef.current = response.data.length === 20;
      searchPageRef.current = reset ? 2 : searchPageRef.current + 1;

      if (reset && response.data.length === 0) {
        message.info("No matching results found.");
      }
    } catch (err) {
      console.error("Search error:", err);
      message.error("An error occurred during search.");
    } finally {
      setFetchingMore(false);
      setIsSearching(false);
    }
  }, [setPosts]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreRef.current && !fetchingMoreRef.current) {
        if (searchQueryRef.current) {
          handleSearch(searchQueryRef.current, false);
        } else {
          fetchPosts(false);
        }
      }
    });

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [posts, handleSearch]);

  const handleImageUpload = (file) => {
    if (!validateImageFile(file)) {
      return false;
    }

    createImagePreview(file, setImagePreview);
    setImageFile(file);

    return false;
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!imageFile) {
      message.error("Please select an image");
      return;
    }

    if (!newPostContent.trim()) {
      message.error("Please add a description");
      return;
    }

    setLoading(true);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });

      const fileInfo = await convertFileToBase64(imageFile);

      const payload = {
        image: fileInfo.base64Data,
        mime_type: fileInfo.mimeType,
        description: newPostContent,
        filename: imageFile.name
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log(response.data.message);
      message.success(response.data.message || "Post created successfully!");

      setImageFile(null);
      setImagePreview(null);
      setNewPostContent("");

      pageRef.current = 1;
      hasMoreRef.current = true;
      fetchPosts(true);

    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = (postId) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked }
        : post
    ));
  };

  if (loading && posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#666' }}>Loading posts...</div>
      </div>
    );
  }

  return (
    <>
      {/* Search Bar Section */}
      <Card style={{ marginBottom: '16px' }}>
        <Search
          placeholder="Search for posts..."
          enterButton="Search"
          size="large"
          loading={isSearching}
          onSearch={handleSearch}
          allowClear
        />
      </Card>

      {/* Create Post Card if authenticated */}
      {isAuthenticated && (
        <Card
          style={{ marginBottom: '16px' }}
          bodyStyle={{ padding: '16px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space align="start" style={{ width: '100%' }}>
              <Avatar
                src={user?.picture}
                icon={!user?.picture && <UserOutlined />}
                size={48}
              />
              <TextArea
                placeholder="What's on your mind?"
                rows={3}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                style={{ flex: 1 }}
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Space>

            {imagePreview && (
              <div style={{ position: 'relative', maxWidth: '100%' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    borderRadius: '8px',
                    objectFit: 'contain'
                  }}
                />
                <Button
                  danger
                  size="small"
                  onClick={handleRemoveImage}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px'
                  }}
                >
                  Remove
                </Button>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #f0f0f0',
              paddingTop: '12px'
            }}>
              <Upload
                beforeUpload={handleImageUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  type="text"
                  icon={<PictureOutlined />}
                >
                  Photo/Video
                </Button>
              </Upload>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={!imageFile || !newPostContent.trim()}
              >
                Post
              </Button>
            </div>
          </Space>
        </Card>
      )}

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <span style={{ fontSize: '16px', fontWeight: 500 }}>No posts yet</span>
                <span style={{ color: '#899' }}>{isAuthenticated ? 'Be the first to share something!' : 'Log in to share your photos!'}</span>
              </Space>
            }
          />
        </Card>
      ) : (
        <>
          {posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              <Post
                post={post}
                onLike={handleLikePost}
                clickable={true}
                isAuthenticated={isAuthenticated}
              />
            </div>
          ))}

          {fetchingMore && hasMoreRef.current && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin />
              <div style={{ marginTop: '8px', color: '#666' }}>Loading more posts...</div>
            </div>
          )}

          {!hasMoreRef.current && posts.length > 0 && (
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
    </>
  );
}

export default Feed;