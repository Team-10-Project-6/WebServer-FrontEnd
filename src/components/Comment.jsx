import { Avatar, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';

function Comment({ comment }) {
  const authorName = comment.author || 'Anonymous';
  const avatarUrl = null;
  const text = comment.text || '';

  return (
    <div style={{ 
      padding: '12px 0',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <Space align="start" style={{ width: '100%' }}>
        <Avatar 
          src={avatarUrl} 
          icon={!avatarUrl && <UserOutlined />}
          size={32}
        />
        <div style={{ flex: 1 }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '14px', marginRight: '8px' }}>
              {authorName}
            </span>
          </div>
          <div style={{ 
            marginTop: '4px',
            fontSize: '14px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap'
          }}>
            {text}
          </div>
        </div>
      </Space>
    </div>
  );
}

export default Comment;