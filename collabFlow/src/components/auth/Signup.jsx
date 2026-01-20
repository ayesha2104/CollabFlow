import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Validation
        if (!formData.name || !formData.email || !formData.password || formData.role === '') {
            toast.error('Please fill in all required fields');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            // TODO: Replace with actual API call
            // const response = await api.post('/auth/signup', formData);
            console.log('Signing up with:', formData);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            localStorage.setItem('user', JSON.stringify(formData));

            toast.success('Account created successfully!');
            navigate('/dashboard'); // Redirect to dashboard or login
        } catch (error) {
            toast.error(error.response?.data?.message || 'Signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-subtitle">Join CollabFlow and start collaborating today</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Name Field */}
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.5rem' }}
                                disabled={isLoading}
                            />
                            <User
                                size={18}
                                color="#94a3b8"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="form-group">
                        <label className="form-label">Work Email</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="name@company.com"
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
                    {/* Role Field */}
                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <select
                            name="role"
                            className="form-input"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={isLoading}
                        >
                            <option value="">Select Role</option>
                            <option value="admin">Admin</option>
                            <option value="Member">Team Member</option>
                            <option value="Project Manager">Project Manager</option>
                            <option value="Client">Client</option>
                        </select>
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="Min. 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.5rem' }}
                                disabled={isLoading}
                            />
                            <Lock
                                size={18}
                                color="#94a3b8"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                            />
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="Repeat password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.5rem' }}
                                disabled={isLoading}
                            />
                            <CheckCircle
                                size={18}
                                color="#94a3b8"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                            />
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
                                Creating Account...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                Sign Up <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                            </span>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
