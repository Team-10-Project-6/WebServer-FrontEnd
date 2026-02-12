import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";


const Feed = () => {
    const { getAccessTokenSilently } = useAuth0();
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
    // Get Auth0 access token
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE
      }
    });

    // Convert image file to Base64
    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          // strip off the "data:image/...;base64," prefix
          const base64Data = reader.result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = (err) => reject(err);
      });

    const imageBase64 = await toBase64(imageFile);

    // Create JSON payload
    const payload = {
      image: imageBase64,
      description: description,
      filename: imageFile.name
    };

    // Send POST request with JSON
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
    alert(response.data.message);

    // Clear inputs
    setImageFile(null);
    setDescription("");

  } catch (err) {
    console.error(err);
    alert(err.response?.data?.error || "An unexpected error occurred.");
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
