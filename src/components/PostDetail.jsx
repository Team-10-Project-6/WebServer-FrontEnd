import { Button, message, Spin, Empty, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Post from './Post';
import CommentSection from './CommentSection';

function PostDetail({ isAuthenticated }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}`
      );

      let postData = response.data;
      if (Array.isArray(postData)) {
        postData = postData[0];
      }

      setPost(postData);
      setIsLiked(postData.liked || false);
      setLikes(postData.likes || 0);
    } catch (error) {
      console.error('Error fetching post:', error);
      message.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/comments/${postId}`
      );

      let commentsData = response.data;
      if (commentsData.comments) {
        commentsData = commentsData.comments;
      }
      if (!Array.isArray(commentsData)) {
        commentsData = [];
      }

      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      message.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return (
      <Card>
        <Empty description="Post not found" />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button onClick={() => navigate('/feed')}>Back to Feed</Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/feed')}
        style={{ marginBottom: '16px' }}
      >
        Back to Feed
      </Button>

      <Post 
        post={post}
        onLike={handleLike}
        isLiked={isLiked}
        likes={likes}
        commentCount={comments.length}
        clickable={false}
      />

      <CommentSection 
        postId={postId}
        comments={comments}
        commentsLoading={commentsLoading}
        onCommentAdded={fetchComments}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}

export default PostDetail;