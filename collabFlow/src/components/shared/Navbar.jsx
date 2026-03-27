import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, Search, Menu, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef(null);

    const { user, logout, isAuthenticated } = useAuth();
    const { connected } = useSocket();

    useEffect(() => {
        if (location.pathname === '/dashboard') {
            const params = new URLSearchParams(location.search);
            setSearchQuery(params.get('search') || '');
        } else {
            setSearchQuery('');
        }
    }, [location.search, location.pathname]);

    useEffect(() => {
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
        navigate(searchQuery.trim()
            ? `/dashboard?search=${encodeURIComponent(searchQuery)}`
            : `/dashboard`
        );
    };

    const handleLogout = () => {
        logout();
        toast.info('Logged out successfully');
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (!isAuthenticated || !user) return null;

    return (
        <nav className="border-b border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
                        {/* Improved logo mark: two overlapping rounded squares suggesting "collaboration" */}
                        <div className="relative w-9 h-9 flex-shrink-0">
                            {/* Back square */}
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-violet-500 rounded-lg opacity-80 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform duration-300" />
                            {/* Front square */}
                            <div className="absolute top-0 left-0 w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center shadow-md group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 4h8M2 8h5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 tracking-tight">
                            CollabFlow
                        </span>
                    </Link>

                    {/* Desktop */}
                    <div className="hidden md:flex items-center gap-4">

                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative group">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="bg-slate-800/50 border border-slate-700 text-sm rounded-full pl-9 pr-4 py-2 w-56 text-slate-200
                                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                                transition-all duration-300 hover:border-slate-500 placeholder:text-slate-500"
                            />
                        </form>

                        {/* Divider */}
                        <div className="h-5 w-px bg-slate-700/80" />

                        {/* Notifications */}
                        <div className="relative" ref={notificationsRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 rounded-lg hover:bg-slate-700/70 transition-colors relative"
                                aria-label="Notifications"
                            >
                                <Bell size={18} className="text-slate-400 hover:text-slate-200 transition-colors" />
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                                    <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                                        <h3 className="text-white font-semibold text-sm">Notifications</h3>
                                        <span className="text-xs text-slate-500">0 new</span>
                                    </div>
                                    <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                                        <Bell size={28} className="opacity-20" />
                                        <p className="text-sm">You're all caught up!</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="h-5 w-px bg-slate-700/80" />

                        {/* User Section */}
                        <div className="flex items-center gap-3">

                            {/* Avatar */}
                            <div className="group cursor-pointer flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 p-[2px] group-hover:scale-105 transition-transform">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[11px] font-bold text-white tracking-wide">
                                        {getInitials(user.name)}
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="hidden lg:flex flex-col leading-tight">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-white leading-none">{user.name}</span>
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                                </div>
                                <span className="text-xs text-slate-500 leading-none mt-0.5">{user.email}</span>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
                            >
                                <LogOut size={15} />
                                <span className="hidden lg:inline text-sm">Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-slate-700 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={22} className="text-slate-300" /> : <Menu size={22} className="text-slate-300" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-slate-800 border-t border-slate-700 animate-in slide-in-from-top">
                    <div className="px-4 py-4 space-y-3">
                        {/* User row */}
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 p-[2px] flex-shrink-0">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                                    {getInitials(user.name)}
                                </div>
                            </div>
                            <div className="flex flex-col leading-tight">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-white">{user.name}</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                                </div>
                                <span className="text-xs text-slate-400">{user.email}</span>
                            </div>
                        </div>

                        <Link
                            to="/dashboard"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm"
                        >
                            Dashboard
                        </Link>

                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                handleLogout();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm"
                        >
                            <LogOut size={15} />
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;