import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  NotebookPen,
  MessageCircle,
  ClipboardList,
  HelpCircle,
  CalendarDays,
  BookOpen,
  GraduationCap,
  TrendingUp,
  User,
  LogOut,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/assistant', label: 'Assistant', icon: MessageCircle },
  { to: '/quiz', label: 'Quiz', icon: ClipboardList },
  { to: '/questions', label: 'Doubts', icon: HelpCircle },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/diary', label: 'Diary', icon: BookOpen },
  { to: '/grades', label: 'Grades', icon: GraduationCap },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-stone-200 flex flex-col fixed inset-y-0">
        <div className="px-5 py-5 border-b border-stone-100">
          <h1 className="text-lg font-bold text-stone-900">StudyBuddy</h1>
          <p className="text-xs text-stone-400">your personal assistant</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-amber-50 text-amber-800' : 'text-stone-600 hover:bg-stone-50'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-stone-100">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-stone-500 truncate">{user?.name || 'Student'}</span>
            {user?.streak > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                <Flame size={13} /> {user.streak}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-stone-500 hover:bg-stone-50 hover:text-red-600"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 p-6 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
