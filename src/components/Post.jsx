import { Card, Avatar, Button, Space, Dropdown, Modal } from 'antd';
import { 
  UserOutlined, 
  HeartOutlined, 
  HeartFilled,
  CommentOutlined, 
  ShareAltOutlined,
  EllipsisOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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

function Post({ 
  post, 
  onLike, 
  isLiked, 
  likes, 
  commentCount,
  clickable = true
}) {
  const navigate = useNavigate();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const postMenuItems = [
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
  };

  const handlePostClick = () => {
    if (!clickable) return;
    
    const postId = post.post_id || post.id;
    navigate(`/post/${postId}`);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (clickable) {
      // In feed view, navigate to detail
      handlePostClick(e);
    } else {
      // In detail view, open modal
      setIsImageModalOpen(true);
    }
  };

  const postId = post.post_id || post.id;
  const authorName = post.username || post.author || 'Anonymous';
  const avatarUrl = post.avatar || post.profile_picture || null;
  const description = post.description || post.content || '';
  const imageUrl = getImageDataUrl(post);
  const timestamp = post.uploaded_at || post.timestamp;
  
  const displayLikes = likes !== undefined ? likes : (post.likes || 0);
  const displayIsLiked = isLiked !== undefined ? isLiked : (post.liked || false);
  const displayCommentCount = commentCount !== undefined ? commentCount : (post.comments || 0);

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
        {description && (
          <div style={{ 
            marginBottom: imageUrl ? '12px' : '12px',
            fontSize: '15px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap'
          }}>
            {description}
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
        bodyStyle={{ padding: 0 }}
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
    </>
  );
}

export default Post;