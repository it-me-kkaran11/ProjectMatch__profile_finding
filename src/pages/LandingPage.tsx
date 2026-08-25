import { Users, Compass, FolderKanban, Sparkles, ArrowRight, CheckCircle2, Zap, Target } from 'lucide-react';
import { useNav } from '@/nav';
import { Avatar } from '@/components/Avatar';
import { students } from '@/data/mockData';

export function LandingPage() {
  const { navigate } = useNav();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-700 text-lg text-ink-900 tracking-tight">ProjectMatch</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate({ name: 'login' })} className="btn-ghost">Log in</button>
            <button onClick={() => navigate({ name: 'signup' })} className="btn-primary">Sign up</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 to-transparent" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 left-10 w-64 h-64 bg-accent-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 chip bg-brand-50 text-brand-700 border border-brand-200 mb-6 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5" />
              Built for university students
            </div>
            <h1 className="font-display font-800 text-4xl sm:text-5xl lg:text-6xl text-ink-900 tracking-tight leading-[1.1] text-balance animate-slide-up">
              Find the right people.
              <br />
              Build the right team.
            </h1>
            <p className="text-lg text-ink-500 mt-6 leading-relaxed max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              ProjectMatch helps university students discover talented teammates, form project teams, and identify the skills they're missing — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button onClick={() => navigate({ name: 'signup' })} className="btn-primary px-6 py-3 text-base">
                Get started free <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate({ name: 'dashboard' })} className="btn-secondary px-6 py-3 text-base">
                Explore the demo
              </button>
            </div>
          </div>

          {/* Floating avatars */}
          <div className="relative mt-16 lg:mt-20">
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto">
              {students.slice(0, 8).map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => navigate({ name: 'student', id: s.id })}
                  className="group flex flex-col items-center gap-2 animate-scale-in"
                  style={{ animationDelay: `${0.3 + i * 0.05}s` }}
                >
                  <Avatar initials={s.initials} color={s.avatarColor} size="lg" />
                  <span className="text-xs font-600 text-ink-600 group-hover:text-brand-700 transition-colors max-w-[80px] truncate">
                    {s.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-ink-400 mt-4">12,000+ students already building teams</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-700 text-3xl text-ink-900 tracking-tight">Everything you need to form a team</h2>
          <p className="text-ink-500 mt-3">From discovery to skill gap analysis — ProjectMatch covers the full journey.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Compass, title: 'Discover Talent', desc: 'Search and filter students by skills, department, availability, and work style. Find the exact person your team needs.' },
            { icon: FolderKanban, title: 'Project Marketplace', desc: 'Browse open projects or post your own. See required skills, team size, and timelines at a glance.' },
            { icon: Target, title: 'Skill Gap Analysis', desc: 'See exactly which skills your team is missing and get matched with students who fill the gaps.' },
            { icon: Users, title: 'Team Formation', desc: 'Create teams, assign roles, and track skill coverage. Visual dashboards show how complete your team is.' },
            { icon: Zap, title: 'Match Scores', desc: 'Our matching algorithm scores how well a student fits your project based on skills, interests, and availability.' },
            { icon: CheckCircle2, title: 'Opportunities', desc: 'Discover hackathons, internships, grants, and competitions matched to your team and skills.' },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card card-hover p-6">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-600" strokeWidth={2} />
                </div>
                <h3 className="font-700 text-ink-900">{f.title}</h3>
                <p className="text-sm text-ink-500 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-ink-900 to-ink-800 p-10 lg:p-16 text-center">
          <h2 className="font-display font-700 text-3xl lg:text-4xl text-white tracking-tight">Ready to find your team?</h2>
          <p className="text-ink-300 mt-3 max-w-xl mx-auto">Join thousands of students building projects, winning hackathons, and launching startups together.</p>
          <button onClick={() => navigate({ name: 'signup' })} className="btn bg-white text-ink-900 hover:bg-ink-100 px-6 py-3 text-base mt-6 font-600">
            Create your profile <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-700 text-ink-900">ProjectMatch</span>
          </div>
          <p className="text-sm text-ink-400">Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
}
