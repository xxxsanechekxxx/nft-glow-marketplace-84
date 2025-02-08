
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { AuthModal } from './AuthModal';
import { useAuth } from "@/hooks/useAuth";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5"></div>
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-400 animate-pulse group-hover:scale-110 transition-transform duration-300"></div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-500 group-hover:opacity-80 transition-opacity">
              PureNFT
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm hover:text-primary transition-all duration-300 relative group ${
                isActive('/') ? 'text-primary' : ''
              }`}
            >
              Home
              <div className={`absolute bottom-[-20px] left-0 w-full h-[2px] bg-gradient-to-r from-primary to-purple-400 transform origin-left transition-transform duration-300 ${
                isActive('/') ? 'scale-x-100' : 'scale-x-0'
              } group-hover:scale-x-100`} />
            </Link>
            <Link 
              to="/marketplace" 
              className={`text-sm hover:text-primary transition-all duration-300 relative group ${
                isActive('/marketplace') ? 'text-primary' : ''
              }`}
            >
              Marketplace
              <div className={`absolute bottom-[-20px] left-0 w-full h-[2px] bg-gradient-to-r from-primary to-purple-400 transform origin-left transition-transform duration-300 ${
                isActive('/marketplace') ? 'scale-x-100' : 'scale-x-0'
              } group-hover:scale-x-100`} />
            </Link>
            {user ? (
              <Link to="/profile">
                <Button variant="outline" className="flex items-center gap-2 bg-background/50 backdrop-blur-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                  <User className="w-4 h-4" />
                  {user.user_metadata.login || 'Profile'}
                </Button>
              </Link>
            ) : (
              <AuthModal 
                trigger={
                  <Button variant="outline" className="flex items-center gap-2 bg-background/50 backdrop-blur-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                    <User className="w-4 h-4" />
                    Login
                  </Button>
                }
              />
            )}
          </nav>

          <button
            className="md:hidden p-2 hover:bg-primary/5 rounded-lg transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="text-primary" /> : <Menu className="text-primary" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-primary/10 animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className={`text-sm hover:text-primary transition-colors duration-300 ${
                  isActive('/') ? 'text-primary' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/marketplace" 
                className={`text-sm hover:text-primary transition-colors duration-300 ${
                  isActive('/marketplace') ? 'text-primary' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Marketplace
              </Link>
              {user ? (
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full flex items-center gap-2 justify-center bg-background/50 backdrop-blur-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                    <User className="w-4 h-4" />
                    {user.user_metadata.login || 'Profile'}
                  </Button>
                </Link>
              ) : (
                <AuthModal 
                  trigger={
                    <Button variant="outline" className="w-full flex items-center gap-2 justify-center bg-background/50 backdrop-blur-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                      <User className="w-4 h-4" />
                      Login
                    </Button>
                  }
                />
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
