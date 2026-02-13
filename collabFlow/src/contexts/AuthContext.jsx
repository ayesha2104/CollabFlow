import React, { createContext, useState, useEffect, useCallback } from 'react';
import api, { authAPI } from '../services/api';
import config from '../config';

export const AuthContext = createContext(null);



export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is authenticated on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

                // Optionally verify token with backend
                // Verify token with backend
                try {
                    const response = await authAPI.getProfile();
                    // Backend returns { user: {...} } or { data: { user: {...} } }
                    const userData = response.data.user || response.data.data?.user || response.data.data || response.data;
                    setUser(userData);
                } catch (error) {
                    // Token invalid, clear auth
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    delete api.defaults.headers.common['Authorization'];
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (credentials) => {
        try {
            // Real API call
            const response = await authAPI.login(credentials);
            // Backend returns { token, user } or { data: { token, user } }
            const responseData = response.data.data || response.data;
            const responseToken = responseData.token;
            const responseUser = responseData.user;

            localStorage.setItem('token', responseToken);
            localStorage.setItem('user', JSON.stringify(responseUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${responseToken}`;

            setToken(responseToken);
            setUser(responseUser);

            return { success: true, user: responseUser };
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed';
            throw new Error(errorMessage);
        }
    }, []);

    const signup = useCallback(async (userData) => {
        try {
            // Real API call
            const response = await authAPI.signup(userData);
            // Backend returns { token, user } or { data: { token, user } }
            const responseData = response.data.data || response.data;
            const responseToken = responseData.token;
            const responseUser = responseData.user;

            localStorage.setItem('token', responseToken);
            localStorage.setItem('user', JSON.stringify(responseUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${responseToken}`;

            setToken(responseToken);
            setUser(responseUser);

            return { success: true, user: responseUser };
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Signup failed';
            throw new Error(errorMessage);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // Call logout endpoint if using real API
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with local logout even if API call fails
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            setToken(null);
            setUser(null);
        }
    }, []);

    const updateUser = useCallback((updates) => {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, [user]);

    const value = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
