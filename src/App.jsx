import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import Profile from './Profile';
import axios from 'axios';
import { useState, useEffect } from 'react';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Feed from "./Feed";
import ContinueButton from './ContinueButton';
//import api, { setTokenGetter } from './api/axiosConfig';


function App() {
  const { loginWithRedirect, logout, isLoading, isAuthenticated, getAccessTokenSilently, user, error } = useAuth0();
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);

  console.log('AUDIENCE CHECK:', import.meta.env.VITE_AUTH0_AUDIENCE);
  useEffect(() => {
    if (isAuthenticated) {
      callProtectedEndpoint();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-state">
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  // if (isAuthenticated) 
  // {
  //   console.log("got here!")
  //   const token = getAccessTokenSilently();
  //   axios.get('${process.env.API_URL}/api/foobar',{
  //     headers: {
  //       Authorization: 'Bearer ${token}'
  //     }
  //   })
  //   .then(Response => console.log(Response.data.message));
  // }
  

  const callProtectedEndpoint = async () => {
    try {
      const token = await getAccessTokenSilently({
            authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE
          }
        }
      );

      console.log('Token:', token);
      console.log('Token segments:', token.split('.').length);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(response.data)
      setData(response.data);
    } catch (error) {
      console.error('Error calling protected endpoint:', error);
      // Axios errors have more detail
      if (error.response) {
        // Server responded with error status
        console.error('Response error:', error.response.data);
        console.error('Status:', error.response.status);
      } else if (error.request) {
        // Request made but no response
        console.error('No response received');
      }
    }
  };
  
  if (error) {
    return (
      <div className="app-container">
        <div className="error-state">
          <div className="error-title">Oops!</div>
          <div className="error-message">Something went wrong</div>
          <div className="error-sub-message">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-card-wrapper">
        <img 
          src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png" 
          alt="Auth0 Logo" 
          className="auth0-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="main-title">Welcome to Project 6 - Photo Sharing App!</h1>
        
        {isAuthenticated ? (
          <div className="logged-in-section">
            <div className="logged-in-message">✅ Successfully authenticated!</div>
            <h2 className="profile-section-title">Your Profile</h2>
            <div className="profile-card">
              <Profile />
            </div>
            <LogoutButton />
            <ContinueButton />
          </div>
        ) : (
          <div className="action-card">
            <p className="action-text">Get started by signing in to your account</p>
            <LoginButton />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;