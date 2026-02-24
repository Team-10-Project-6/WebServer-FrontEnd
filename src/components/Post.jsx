import { Card, Avatar, Button, Space, Dropdown, Modal, message, Input, Upload, Divider } from 'antd';
import { 
  PictureOutlined,
  UserOutlined, 
  HeartOutlined, 
  HeartFilled,
  CommentOutlined, 
  ShareAltOutlined,
  EllipsisOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios'; 

const { TextArea } = Input;

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

const getImageDataUrl = (post) => {
  if (!post.base64_image || !post.mime_type) return null;
  return `data:${post.mime_type};base64,${post.base64_image}`;
};

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const [prefix, base64Data] = reader.result.split(",");
      const mimeType = prefix.match(/:(.*?);/)[1];
      resolve({ base64Data, mimeType });
    };
    reader.onerror = (err) => reject(err);
  });
};

function Post({ 
  currentUsername,
  onPostDeleted,
  isAuthenticated,
  post, 
  onLike, 
  isLiked, 
  likes, 
  commentCount,
  clickable = true
}) {
  const navigate = useNavigate();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user, getAccessTokenSilently } = useAuth0();
  const [editDescription, setEditDescription] = useState(post.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localDescription, setLocalDescription] = useState(post.description || '');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  
  const postId = post.post_id || post.id;
  const authorName = post.username || post.author || 'Anonymous';
  const avatarUrl = post.avatar || post.profile_picture || null;
  const imageUrl = getImageDataUrl(post);
  const timestamp = post.uploaded_at || post.timestamp;
  const myUsername = currentUsername || (user?.sub ? `user_${user.sub.substring(0, 8)}` : null);
  
  const isAuthor = isAuthenticated && myUsername === authorName;

  const displayLikes = likes !== undefined ? likes : (post.likes || 0);
  const displayIsLiked = isLiked !== undefined ? isLiked : (post.liked || false);
  const displayCommentCount = commentCount !== undefined ? commentCount : (post.comments || 0);

  const postMenuItems = [
    ...(isAuthor ? [
      { 
        key: 'edit',
        label: 'Edit post'
      },
      { key: 'delete',
        label: 'Delete post',
        danger: true
      },
    ] : []),
    { 
      key: 'save',
      label: 'Save post',
     },
    { 
      key: 'report',
      label: 'Report post',
      danger: true,
     },
  ];

  const handleMenuClick = ({ key }) => {
    console.log('Post menu clicked:', key, post.post_id || post.id);
    
    switch(key) {
      case 'edit':
        setEditDescription(localDescription);
        setIsEditModalOpen(true);
        break;  
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'save':
        message.info('Save functionality coming soon');
        break;
      case 'report':
        message.info('Report functionality coming soon');
        break;
      default:
        break;
    }
  };

  const handleEditSubmit = async () => {
    if (!editDescription.trim()) {
      message.error('Description cannot be empty');
      return;
    }

    setIsUpdating(true);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });

      const payload = { description: editDescription };

      if (newImageFile) {
        const fileInfo = await convertFileToBase64(newImageFile);
        payload.image = fileInfo.base64Data;
        payload.mime_type = fileInfo.mimeType;
      }
      
      console.log('Updating post with payload:', payload);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      message.success('Post updated successfully');
      setLocalDescription(editDescription);
      setIsEditModalOpen(false);
      setNewImageFile(null);
      setNewImagePreview(null);

      if (onPostDeleted) {
        onPostDeleted();
      }

    } catch (err) {
      console.error('Error updating post:', err);
      message.error(err.response?.data?.error || 'Failed to update post');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      message.success('Post deleted successfully');
      setIsDeleteModalOpen(false);

      // Notify parent component to refresh
      if (onPostDeleted) {
        onPostDeleted();
      }

    } catch (err) {
      console.error('Error deleting post:', err);
      message.error(err.response?.data?.error || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePostClick = () => {
    if (!clickable) return;
    navigate(`/post/${postId}`);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (clickable) {
      // In feed view, navigate to detail
      handlePostClick();
    } else {
      // In detail view, open modal
      setIsImageModalOpen(true);
    }
  };

  return (
    <>
      <Card 
        style={{ marginBottom: '16px' }}
        bodyStyle={{ padding: '16px' }}
      >
        {/* Post Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '12px'
        }}>
          <Space>
            <Avatar 
              src={avatarUrl} 
              icon={!avatarUrl && <UserOutlined />}
              size={40}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{authorName}</div>
              <div style={{ fontSize: '13px', color: '#8c8c8c' }}>
                {formatTimestamp(timestamp)}
              </div>
            </div>
          </Space>
          <Dropdown
            menu={{ items: postMenuItems, onClick: handleMenuClick }}
            trigger={['click']}
          >
            <Button 
              type="text" 
              icon={<EllipsisOutlined />}
              style={{ color: '#8c8c8c' }}
            />
          </Dropdown>
        </div>

        {/* Post Content/Description */}
        {localDescription && (
          <div style={{ 
            marginBottom: imageUrl ? '12px' : '12px',
            fontSize: '15px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap'
          }}>
            {localDescription}
          </div>
        )}

        {/* Post Image */}
        {imageUrl && (
          <div 
            onClick={handleImageClick}
            style={{ 
              marginBottom: '12px', 
              cursor: clickable ? 'pointer' : 'default' 
            }}
          >
            <img 
              src={imageUrl} 
              alt="Post content" 
              style={{ 
                width: '100%', 
                borderRadius: '8px',
                maxHeight: '500px',
                objectFit: 'cover'
              }} 
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            />
          </div>
        )}

        {/* Post Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          borderTop: '1px solid #f0f0f0', 
          paddingTop: '8px' 
        }}>
          <Button 
            type="text" 
            icon={displayIsLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={() => onLike(postId)}
            style={{ 
              flex: 1,
              color: displayIsLiked ? '#ff4d4f' : undefined
            }}
          >
            {displayLikes > 0 ? displayLikes : 'Like'}
          </Button>
          <Button 
            type="text" 
            icon={<CommentOutlined />}
            onClick={clickable ? handlePostClick : undefined}
            style={{ flex: 1 }}
          >
            {displayCommentCount > 0 ? displayCommentCount : 'Comment'}
          </Button>
          <Button 
            type="text" 
            icon={<ShareAltOutlined />}
            style={{ flex: 1 }}
          >
            Share
          </Button>
        </div>
      </Card>

      {/* Full Image Modal */}
      <Modal
        open={isImageModalOpen}
        onCancel={() => setIsImageModalOpen(false)}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        styles={{ body: { padding: 0 } }}
      >
        <img 
          src={imageUrl} 
          alt="Full size" 
          style={{ 
            width: '100%', 
            height: 'auto',
            maxHeight: '90vh',
            objectFit: 'contain'
          }} 
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Post"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setNewImagePreview(null);
        }}
        onOk={handleEditSubmit}
        confirmLoading={isUpdating}
        okText="Save Changes"
      >
        <p style={{ fontWeight: 600 }}>Description</p>
        <TextArea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Edit your post description..."
          autoSize={{ minRows: 4, maxRows: 10 }}
          style={{ marginTop: '16px' }}
        />
        <Divider />

        <p style={{ fontWeight: 600 }}>Replace Image (Optional)</p>
        <Upload
          beforeUpload={(file) => {
            setNewImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setNewImagePreview(e.target.result);
            reader.readAsDataURL(file);
            return false; // Prevent auto-upload
          }}
          showUploadList={false}
        >
          <Button icon={<PictureOutlined />}>Select New Image</Button>
        </Upload>

        {newImagePreview && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <p>Preview:</p>
            <img 
              src={newImagePreview} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} 
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Post"
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onOk={handleDelete}
        confirmLoading={isDeleting}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this post? This action cannot be undone.</p>
      </Modal>
    </>
  );
}

export default Post;