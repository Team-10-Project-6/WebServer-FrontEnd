import { Card, Avatar, Button, Space, Dropdown } from 'antd';
import { 
  UserOutlined, 
  HeartOutlined, 
  HeartFilled,
  CommentOutlined, 
  ShareAltOutlined,
  EllipsisOutlined 
} from '@ant-design/icons';

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

// Helper function to construct image data URL from base64
const getImageDataUrl = (post) => {
  if (!post.base64_image || !post.mime_type) return null;
  
  return `data:${post.mime_type};base64,${post.base64_image}`;
};

function Post({ post, onLike }) {
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

  // Extract data from backend structure
  const postId = post.post_id || post.id;
  const authorName = post.username || post.author || 'Anonymous';
  const avatarUrl = post.avatar || post.profile_picture || null;
  const description = post.description || post.content || '';
  const imageUrl = getImageDataUrl(post);
  const timestamp = post.created_at || post.timestamp;
  const likes = post.likes || 0;
  const comments = post.comments || 0;
  const isLiked = post.liked || false;

  return (
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
        <div style={{ marginBottom: '12px' }}>
          <img 
            src={imageUrl} 
            alt="Post content" 
            style={{ 
              width: '100%', 
              borderRadius: '8px',
              maxHeight: '500px',
              objectFit: 'cover'
            }} 
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
          icon={isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
          onClick={() => onLike(postId)}
          style={{ 
            flex: 1,
            color: isLiked ? '#ff4d4f' : undefined
          }}
        >
          {likes > 0 ? likes : 'Like'}
        </Button>
        <Button 
          type="text" 
          icon={<CommentOutlined />}
          style={{ flex: 1 }}
        >
          {comments > 0 ? comments : 'Comment'}
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
  );
}

export default Post;