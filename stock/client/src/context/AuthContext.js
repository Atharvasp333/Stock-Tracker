import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  // In production (Render), use relative URL since frontend and backend are on same domain
  // In development, use localhost:5000
  const API_URL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
  
  console.log('API_URL configured as:', API_URL);
  
  axios.defaults.baseURL = API_URL;
  axios.defaults.timeout = 10000; // 10 second timeout
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, API_URL });
      console.log('Full URL will be:', `${API_URL}/auth/login`);
      
      const response = await axios.post('/auth/login', { email, password }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Login response:', response.data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return response.data;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  };

  const register = async (name, email, password) => {
    console.log('Attempting registration with:', { name, email, API_URL });
    const response = await axios.post('/auth/register', { name, email, password });
    console.log('Registration response:', response.data);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};