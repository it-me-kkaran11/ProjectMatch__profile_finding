import { Users, Compass, FolderKanban, UsersRound, User, LogOut, Search } from 'lucide-react';
import { useNav, type Route } from '@/nav';
import { useAuth } from '@/lib/auth';
import { cn } from '@/utils/cn';

const navItems: { label: string; icon: typeof Users; route: Route }[] = [
  { label: 'Home', icon: Users, route: { name: 'dashboard' } },
  { label: 'Discover', icon: Compass, route: { name: 'discover' } },
  { label: 'Find Talent', icon: Search, route: { name: 'find-talent' } },
  { label: 'Projects', icon: FolderKanban, route: { name: 'projects' } },
  { label: 'My Teams', icon: UsersRound, route: { name: 'teams' } },
  { label: 'Profile', icon: User, route: { name: 'profile' } },
];

export function Navigation() {
  const { route, navigate } = useNav();
  const { signOut } = useAuth();

  const isActive = (item: (typeof navItems)[number]) => {
    if (item.route.name === 'dashboard' && (route.name === 'dashboard')) return true;
    if (item.route.name === 'discover' && (route.name === 'discover' || route.name === 'student')) return true;
    if (item.route.name === 'find-talent' && route.name === 'find-talent') return true;
    if (item.route.name === 'projects' && (route.name === 'projects' || route.name === 'project' || route.name === 'create-project')) return true;
    if (item.route.name === 'teams' && (route.name === 'teams' || route.name === 'team')) return true;
    if (item.route.name === 'profile' && route.name === 'profile') return true;
    return false;
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-ink-100 bg-white h-screen sticky top-0">
      <div className="px-5 py-6">
        <button onClick={() => navigate({ name: 'dashboard' })} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-700 text-lg text-ink-900 tracking-tight">ProjectMatch</span>
        </button>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px]', active ? 'text-brand-600' : 'text-ink-400')} strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-ink-100 space-y-3">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-500 text-ink-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
        <div className="rounded-xl bg-gradient-to-br from-ink-900 to-ink-800 p-4 text-white">
          <p className="text-xs font-600 mb-1">Upgrade to Pro</p>
          <p className="text-[11px] text-ink-300 mb-3 leading-relaxed">Unlock AI-powered team matching and skill gap analysis.</p>
          <button className="text-xs font-600 bg-white text-ink-900 rounded-lg px-3 py-1.5 hover:bg-ink-100 transition-colors w-full">Learn more</button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { route, navigate } = useNav();

  const isActive = (item: (typeof navItems)[number]) => {
    if (item.route.name === 'dashboard' && route.name === 'dashboard') return true;
    if (item.route.name === 'discover' && (route.name === 'discover' || route.name === 'student')) return true;
    if (item.route.name === 'find-talent' && route.name === 'find-talent') return true;
    if (item.route.name === 'projects' && (route.name === 'projects' || route.name === 'project' || route.name === 'create-project')) return true;
    if (item.route.name === 'teams' && (route.name === 'teams' || route.name === 'team')) return true;
    if (item.route.name === 'profile' && route.name === 'profile') return true;
    return false;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-ink-100 z-50 flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.route)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors',
              active ? 'text-brand-600' : 'text-ink-400'
            )}
          >
            <Icon className="w-5 h-5" strokeWidth={2} />
            <span className="text-[10px] font-600">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
