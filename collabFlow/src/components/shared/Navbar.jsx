import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, Search, Menu, X, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Search & Notification States
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef(null);

    const { user, logout, isAuthenticated } = useAuth();
    const { connected } = useSocket();

    useEffect(() => {
        // Initialize search query from URL if on dashboard
        if (location.pathname === '/dashboard') {
            const params = new URLSearchParams(location.search);
            setSearchQuery(params.get('search') || '');
        } else {
            setSearchQuery('');
        }
    }, [location.search, location.pathname]);

    useEffect(() => {
        // Close notifications when clicking outside
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/dashboard?search=${encodeURIComponent(searchQuery)}`);
        } else {
            navigate(`/dashboard`);
        }
    };

    const handleLogout = () => {
        logout();
        toast.info('Logged out successfully');
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Don't render if not authenticated
    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <nav className="border-b border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                                <span className="text-white font-bold text-xl">C</span>
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                                CollabFlow
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="bg-slate-800/50 border border-slate-700 text-sm rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 transition-all text-slate-200"
                            />
                        </form>

                        {/* Notification Bell */}
                        <div className="relative" ref={notificationsRef}>
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="text-slate-400 hover:text-white transition-colors relative"
                            >
                                <Bell size={20} />
                                {/* Optional: Red dot for new notifications */}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                                    <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                                        <h3 className="font-semibold text-white">Notifications</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {/* Placeholder for no notifications */}
                                        <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                            <Bell className="mb-3 opacity-20" size={32} />
                                            <p className="text-sm">You're all caught up!</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-slate-700 mx-2"></div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden lg:block">
                                <div className="flex items-center justify-end gap-2">
                                    <div className="text-sm font-medium text-white">{user.name}</div>
                                    <div
                                        className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'} transition-all duration-500`}
                                        title={connected ? 'Connected to real-time server' : 'Disconnected from real-time server'}
                                    />
                                </div>
                                <div className="text-xs text-slate-400">{user.email}</div>
                            </div>

                            <div className="relative group cursor-pointer">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                                        {getInitials(user.name)}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                            >
                                <LogOut size={16} />
                                <span className="hidden lg:inline">Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-400 hover:text-white p-2"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-slate-800 border-b border-slate-700">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <div className="px-3 py-2 text-white font-medium">{user.name}</div>
                        <div className="px-3 py-1 text-slate-400 text-sm">{user.email}</div>
                        <Link
                            to="/dashboard"
                            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                handleLogout();
                            }}
                            className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-2"
                        >
                            <LogOut size={16} />
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
