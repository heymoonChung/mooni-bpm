import { Outlet } from 'react-router';
import BottomNav from '../components/BottomNav';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-[var(--dark-bg)] flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
