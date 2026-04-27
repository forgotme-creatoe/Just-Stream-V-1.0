import React, { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings as SettingsIcon, Ghost, LogIn, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SettingsModal } from './SettingsModal';
import { useAuth } from '../contexts/AuthContext';
import { useCanUpload } from '../hooks/useCanUpload';
import { useNotifications } from '../hooks/useNotifications';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Music', path: '/browse?type=music' },
  { name: 'Movies', path: '/browse?type=movies' },
  { name: 'Series', path: '/browse?type=series' },
  { name: 'Shorts', path: '/browse?type=shorts' },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signInWithGoogle, signOut } = useAuth();
  const { canUpload, loading: checkingUploadAccess } = useCanUpload();
  const { notifications, readIds, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    import('../utils/userSettings').then(m => {
      const settings = m.getUserSettings();
      setIsIncognito(settings.incognitoMode);
      if (settings.incognitoMode) {
        document.documentElement.classList.add('incognito');
      }
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handleSettingsChange = () => {
      import('../utils/userSettings').then(m => {
        const settings = m.getUserSettings();
        setIsIncognito(settings.incognitoMode);
        if (settings.incognitoMode) {
          document.documentElement.classList.add('incognito');
        } else {
          document.documentElement.classList.remove('incognito');
        }
      });
    };
    window.addEventListener('userSettingsChanged', handleSettingsChange);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('userSettingsChanged', handleSettingsChange);
    };
  }, []);

  const toggleIncognito = () => {
    const newVal = !isIncognito;
    setIsIncognito(newVal);
    if (newVal) {
      document.documentElement.classList.add('incognito');
    } else {
      document.documentElement.classList.remove('incognito');
    }
    import('../utils/userSettings').then(m => {
      m.saveUserSettings({ incognitoMode: newVal });
    });
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 px-6",
        isScrolled ? "glass-panel border-b border-white/5 py-3 shadow-lg" : "bg-transparent border-b border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: isIncognito ? "#dc2626" : "#7e22ce", transition: "stop-color 0.5s ease" }} />
                <stop offset="50%" style={{ stopColor: isIncognito ? "#ef4444" : "#a855f7", transition: "stop-color 0.5s ease" }} />
                <stop offset="100%" style={{ stopColor: isIncognito ? "#f87171" : "#ec4899", transition: "stop-color 0.5s ease" }} />
              </linearGradient>
            </defs>
            <path d="M10 8.5C10 6 12.5 4.5 14.5 6L28.5 15C30.5 16.5 30.5 19.5 28.5 21L14.5 30C12.5 31.5 10 30 10 27.5V8.5Z" stroke="url(#logo-gradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 13.5L23 18L15 22.5V13.5Z" fill="url(#logo-gradient)"/>
          </svg>
          <span className="text-2xl font-bold tracking-tight flex">
            <span className={cn("transition-colors duration-500", isIncognito ? "text-red-500" : "text-purple-500")}>Just</span>
            <span className={cn("transition-colors duration-500", isIncognito ? "text-red-500" : "text-white")}>Stream</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.search.includes(link.path.split('?')[1]));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white relative py-1",
                  isActive ? "text-white" : "text-white/60"
                )}
              >
                {link.name}
                {isActive && (
                  <motion.span 
                    layoutId="nav-indicator"
                    className="absolute -bottom-5 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" 
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/10 focus-within:border-purple-500/50 focus-within:bg-white/10 transition-all">
            <Search className="w-4 h-4 text-white/50 mr-2" />
            <input 
              type="text" 
              placeholder="Search for shows..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 w-48"
            />
          </div>
          
          <button 
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors lg:hidden"
          >
            <Search className="w-5 h-5 text-white/70" />
          </button>

          {/* Incognito Button */}
          <button 
            onClick={toggleIncognito}
            className={cn(
              "p-2 rounded-full transition-colors relative",
              isIncognito ? "text-red-400 bg-red-500/20 hover:bg-red-500/30" : "text-white/70 hover:bg-white/10"
            )}
            title="Incognito Mode"
          >
            <Ghost className="w-5 h-5" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5 text-white/70" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-black text-[10px] font-bold flex items-center justify-center text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 glass-panel rounded-xl py-2 shadow-xl border border-white/10 overflow-hidden z-50 flex flex-col max-h-[400px]"
                >
                  <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <p className="text-sm font-bold text-white">Notifications</p>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-sm text-white/50">No new notifications</p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.link) {
                                navigate(notif.link);
                                setShowNotifs(false);
                              }
                            }}
                            className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors relative ${!readIds.has(notif.id) ? 'bg-purple-900/10' : ''}`}
                          >
                            {!readIds.has(notif.id) && (
                              <div className="absolute left-2 top-4 w-1.5 h-1.5 bg-purple-500 rounded-full" />
                            )}
                            <div className="ml-2">
                              <p className={`text-sm font-medium mb-1 ${!readIds.has(notif.id) ? 'text-white' : 'text-white/80'}`}>{notif.title}</p>
                              <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">{notif.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            {user ? (
              <div className="flex items-center gap-2">
                {!checkingUploadAccess && canUpload && (
                  <Link 
                    to="/upload"
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    Upload
                  </Link>
                )}
                {!checkingUploadAccess && canUpload && (
                  <Link 
                    to="/ads"
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium transition-colors"
                  >
                    Ad Inventory
                  </Link>
                )}
                <button 
                  onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors border border-white/10 ml-2"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-medium transition-colors ml-2"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
            <AnimatePresence>
              {showProfile && user && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 glass-panel rounded-xl py-2 shadow-xl border border-white/10"
                >
                  <div className="px-4 py-3 border-b border-white/10 mb-2">
                    <p className="text-sm font-bold text-white truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-white/50 font-medium mt-0.5 truncate">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => { setShowSettings(true); setShowProfile(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-white/80 hover:text-white"
                  >
                    <SettingsIcon className="w-4 h-4" /> Account Settings
                  </button>
                  <Link 
                    to="/watchlist"
                    onClick={() => setShowProfile(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-white/80 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg> 
                    Watchlist
                  </Link>
                  <button 
                    onClick={() => { signOut(); setShowProfile(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-pink-400 hover:text-pink-300"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden ml-1"
          >
            {showMobileMenu ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>

        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden absolute top-full left-0 w-full bg-black/90 backdrop-blur-md border-b border-white/10 p-4"
          >
            <div className="flex items-center bg-white/10 rounded-full px-4 py-2 border border-white/20">
              <Search className="w-4 h-4 text-white/50 mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
                    setSearchQuery('');
                    setShowMobileSearch(false);
                  }
                }}
                autoFocus
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 flex-1 w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-md border-b border-white/10 overflow-hidden"
          >
            <div className="flex flex-col py-4 px-6 space-y-4">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.search.includes(link.path.split('?')[1]));
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      "text-lg font-medium transition-colors",
                      isActive ? "text-purple-400" : "text-white/70 hover:text-white"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
              
              {!checkingUploadAccess && canUpload && (
                <>
                  <div className="h-px bg-white/10 w-full my-2"></div>
                  <Link 
                    to="/upload"
                    onClick={() => setShowMobileMenu(false)}
                    className="text-lg font-medium text-white/70 hover:text-white flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    Upload Video
                  </Link>
                  <Link 
                    to="/ads"
                    onClick={() => setShowMobileMenu(false)}
                    className="text-lg font-medium text-purple-400 hover:text-purple-300 flex items-center gap-2"
                  >
                    Ad Inventory
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </motion.nav>
  );
}
