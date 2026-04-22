import { NavLink } from 'react-router';
import { Home, Radio, Music, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/beat-drop', icon: Radio, label: 'Beat Drop' },
  { path: '/minus-one', icon: Music, label: 'Minus-One' },
  { path: '/progress', icon: TrendingUp, label: 'Progress' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-20 px-4 flex items-center justify-around"
      style={{
        background: 'linear-gradient(180deg, transparent, var(--dark-bg) 20%)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 0, 255, 0.1)',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        >
          {({ isActive }) => (
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, var(--neon-pink), var(--neon-cyan))',
                    boxShadow: '0 0 15px var(--neon-pink)',
                  }}
                />
              )}
              <item.icon
                className="w-6 h-6 transition-all duration-300"
                strokeWidth={2.0}
                style={{
                  color: isActive ? 'var(--neon-pink)' : 'var(--muted-foreground)',
                  filter: isActive ? 'drop-shadow(0 0 8px var(--neon-pink))' : 'none',
                }}
              />
              <span
                className="text-xs transition-all duration-300"
                style={{
                  color: isActive ? 'var(--neon-cyan)' : 'var(--muted-foreground)',
                  fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                }}
              >
                {item.label}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
