import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
            <defs>
              <linearGradient id="footer-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7e22ce" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <path d="M10 8.5C10 6 12.5 4.5 14.5 6L28.5 15C30.5 16.5 30.5 19.5 28.5 21L14.5 30C12.5 31.5 10 30 10 27.5V8.5Z" stroke="url(#footer-logo-gradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 13.5L23 18L15 22.5V13.5Z" fill="url(#footer-logo-gradient)"/>
          </svg>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-purple-500">Just</span>
            <span className="text-white">Stream</span>
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
          <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        </div>
        <div className="text-sm text-white/40 text-center md:text-right">
          &copy; {new Date().getFullYear()} JustStream. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
