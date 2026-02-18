import { useState, useEffect } from 'react';
import { Card, Input, Button, Space, Avatar, Empty, Upload, message } from 'antd';
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

function Feed({ posts, setPosts, user }) {
  const [newPostContent, setNewPostContent] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      console.log("TRYING TO FETCH");
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/posts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(response.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      message.error("Failed to fetch posts");
    }
  };

  const handleSearch = async (value) => {
      if (!value.trim()) {
        fetchPosts(); 
        return;
      }

      setLoading(true);
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
        });

        // Point this to the NEW /search endpoint
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/posts/search`, 
          { query: value }, 
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        setPosts(response.data);

        if (response.data.length === 0) {
          message.info("No matching results found.");
        }
      } catch (err) {
        console.error("Search error:", err);
        message.error("An error occurred during search.");
      } finally {
        setLoading(false);
      }
    };

  const handleImageUpload = (file) => {
    if (!validateImageFile(file)) {
      return false;
    }

    createImagePreview(file, setImagePreview);
    setImageFile(file);

    return false; // Prevent auto upload
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

      // Clear inputs
      setImageFile(null);
      setImagePreview(null);
      setNewPostContent("");

      // Refresh posts
      await fetchPosts();

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



  return (
    <>
          {/* Search Bar Section */}
      <Card style={{ marginBottom: '16px' }}>
        <Search
          placeholder="Search for posts..."
          enterButton="Search"
          size="large"
          loading={loading}
          onSearch={handleSearch}
          allowClear
        />
      </Card>
      {/* Create Post Card */}
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

          {/* Image Preview */}
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
              disabled={!imageFile}
            >
              Post
            </Button>
          </div>
        </Space>
      </Card>

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <span style={{ fontSize: '16px', fontWeight: 500 }}>No posts yet</span>
                <span style={{ color: '#899' }}>Be the first to share something!</span>
              </Space>
            }
          />
        </Card>
      ) : (
        posts.map(post => (
          <Post 
            key={post.id} 
            post={post}
            onLike={handleLikePost}
          />
        ))
      )}
    </>
  );
}

export default Feed;