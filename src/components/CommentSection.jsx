import { Card, Input, Button, Spin, Empty, message } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import Comment from './Comment';

function CommentSection({ postId, isAuthenticated }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const scrollContainerRef = useRef(null);
  const lastCommentRef = useRef(null);
  const isCurrentlyFetching = useRef(false);

  useEffect(() => {
    fetchComments(true);
  }, [postId]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      
      // Check if scrolled near bottom (within 100px)
      if (scrollHeight - scrollTop - clientHeight < 100) {
        if (hasMoreRef.current && !fetchingMore) {
          fetchComments(false);
        }
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [fetchingMore]);

  const fetchComments = async (reset = false) => {
    if (isCurrentlyFetching.current) return;

    isCurrentlyFetching.current = true;
    setFetchingMore(true);
    if (reset) setLoading(true);

    try {
      const page = reset ? 1 : pageRef.current;
      console.log("Fetching comments - page:", page);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/comments/${postId}?page=${page}`
      );

      const commentsData = response.data;

      if (reset) {
        setComments(commentsData);
        pageRef.current = 2;
      } else {
        setComments(prev => [...prev, ...commentsData]);
        pageRef.current += 1;
      }

      // If we got less than 30 comments, there are no more
      hasMoreRef.current = commentsData.length === 30;
      console.log("Has more:", hasMoreRef.current);

    } catch (err) {
      console.error("Error fetching comments:", err);
      message.error("Failed to fetch comments");
    } finally {
      setLoading(false);
      setFetchingMore(false);
      isCurrentlyFetching.current = false;
    }
  };

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
      
      // Refresh comments from page 1
      pageRef.current = 1;
      hasMoreRef.current = true;
      fetchComments(true);

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
        {loading ? (
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
          <div 
            ref={scrollContainerRef}
            style={{ 
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

            {/* Loading more indicator */}
            {fetchingMore && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Spin size="small" />
                <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
                  Loading more comments...
                </div>
              </div>
            )}

            {/* End of comments message */}
            {!hasMoreRef.current && comments.length >= 30 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '16px 0',
                color: '#999',
                fontSize: '12px'
              }}>
                No more comments
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}

export default CommentSection;