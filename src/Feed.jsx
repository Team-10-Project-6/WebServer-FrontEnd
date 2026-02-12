import { useState, useEffect } from "react";
import axios from "axios";

const Feed = ({ getAccessTokenSilently }) => {
  const [posts, setPosts] = useState([]);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      console.log("TRYING TO FETCH")
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
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle new post submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select an image");

    setLoading(true);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }
      });

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("description", description);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      console.log(response.data.message);

      // Reset form
      setDescription("");
      setImageFile(null);

      // Refresh feed
      await fetchPosts();
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>📸 Photo Feed</h1>

      {/* New post form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          style={{ marginBottom: "0.5rem" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </button>
      </form>

      {/* Feed posts */}
      {posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} style={{ marginBottom: "2rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
            <h3>{post.username}</h3>
            <p>{post.description}</p>
            <img
              src={`${import.meta.env.VITE_API_URL}/api/images/download/${post.id}`}
              alt="post"
              style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
            />
            <div style={{ marginTop: "0.5rem" }}>
              {post.comments.map((c, i) => (
                <p key={i}>
                  <b>{c.author}:</b> {c.text}
                </p>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Feed;
