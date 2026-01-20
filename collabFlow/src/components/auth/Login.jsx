import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'react-toastify';
import Dashboard from '../../pages/Dashboard';
const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Basic Validation
        if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        try {
            // TODO: Replace with actual API call
            // const response = await api.post('/auth/login', formData);
            console.log('Logging in with:', formData);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            let user = JSON.parse(localStorage.getItem('user'));
            if (user.email === formData.email && user.password === formData.password) {
                toast.success('Welcome back!');
                navigate('/dashboard');
            } else {
                toast.error('Invalid email or password');

                navigate('/login');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to continue to CollabFlow</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.5rem' }}
                                disabled={isLoading}
                            />
                            <Mail
                                size={18}
                                color="#94a3b8"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                            <a href="#" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Forgot password?</a>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                disabled={isLoading}
                            />
                            <Lock
                                size={18}
                                color="#94a3b8"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={isLoading}
                        style={{ marginTop: '1rem' }}

                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin" style={{ marginRight: '8px', width: '16px', height: '16px' }} viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                Sign In <LogIn size={18} style={{ marginLeft: '8px' }} />
                            </span>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
