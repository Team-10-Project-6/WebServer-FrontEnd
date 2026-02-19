import { Card, Input, Button, Spin, Empty, message } from 'antd';
import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import Comment from './Comment';

function CommentSection({ postId, comments, commentsLoading, onCommentAdded, isAuthenticated }) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();

  const postComment = async () => {
    if (!isAuthenticated) {
      message.info('Please log in to comment');
      loginWithRedirect();
      return;
    }

    if (!commentText.trim()) {
      message.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });
      
      const payload = {
        post_id: postId,
        text: commentText
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/comments`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      setCommentText("");
      message.success("Comment posted!");
      
      // Notify parent to refresh comments
      if (onCommentAdded) {
        onCommentAdded();
      }

    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Comment Input Section */}
      {isAuthenticated && (
        <Card 
          title="Add a comment"
          style={{ marginBottom: '16px' }}
          bodyStyle={{ padding: '16px' }}
        >
          <Input.TextArea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{ marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              type="primary" 
              onClick={postComment}
              loading={isSubmitting}
              disabled={!commentText.trim()}
            >
              Post Comment
            </Button>
          </div>
        </Card>
      )}

      {/* Comments List */}
      <Card 
        title={`Comments (${comments.length})`}
        bodyStyle={{ padding: '0' }}
      >
        {commentsLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Spin />
          </div>
        ) : comments.length === 0 ? (
          <Empty 
            description={
              isAuthenticated 
                ? "No comments yet. Be the first to comment!" 
                : "No comments yet"
            }
            style={{ padding: '24px 0' }}
          />
        ) : (
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            padding: '0 16px'
          }}>
            {comments.map((comment, index) => (
              <Comment 
                key={index} 
                comment={comment} 
              />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

export default CommentSection;