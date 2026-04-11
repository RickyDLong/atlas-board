import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AtlasLogo } from '@/components/AtlasLogo';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-3">
          <AtlasLogo size={32} />
          <span className="text-white font-semibold tracking-tight">Atlas</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-[#8888a0] text-sm hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 bg-white text-[#0a0a0f] text-sm font-medium rounded-lg hover:bg-[#e8e8f0] transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6">

        {/* Hero */}
        <section className="flex flex-col items-center text-center pt-20 pb-16">
          <div className="mb-8">
            <AtlasLogo size={96} className="rounded-2xl mx-auto shadow-2xl shadow-white/5" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-tight max-w-3xl">
            A Kanban Board That
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Adapts to You
            </span>
          </h1>

          <p className="mt-6 text-lg text-[#8888a0] max-w-lg leading-relaxed">
            Real-time task management with drag-and-drop, epics, filters, and time tracking.
            Choose your style: gamified RPG mode or clean professional view.
          </p>

          <div className="flex items-center gap-4 mt-10">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-white text-[#0a0a0f] font-semibold rounded-lg hover:bg-[#e8e8f0] transition-all text-sm"
            >
              Get started free
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 border border-[#2a2a3a] text-[#e8e8f0] font-medium rounded-lg hover:bg-[#12121a] hover:border-[#2a2a3a] transition-all text-sm"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Mode Showcase */}
        <section className="w-full max-w-4xl pb-20">
          <h2 className="text-center text-xl font-semibold text-white mb-2">Two modes. One board. Switch anytime.</h2>
          <p className="text-center text-sm text-[#8888a0] mb-10">Toggle between views with a single click from your dashboard.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RPG Mode Card */}
            <div className="relative rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-[#12121a] p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">&#x2694;&#xFE0F;</span>
                <h3 className="text-lg font-semibold text-white">RPG Mode</h3>
              </div>
              <p className="text-sm text-[#8888a0] mb-5 leading-relaxed">
                Earn XP for completing tasks. Level up your character. Unlock badges. Track daily streaks. Turn your to-do list into a quest log.
              </p>
              {/* Mini board preview */}
              <div className="flex gap-2">
                {['Quest Log', 'In Battle', 'Conquered'].map((col) => (
                  <div key={col} className="flex-1 rounded-lg bg-[#0a0a0f]/60 border border-[#2a2a3a] p-2">
                    <div className="text-xs font-medium text-purple-400/80 mb-1.5 font-mono">{col}</div>
                    <div className="space-y-1.5">
                      <div className="h-5 rounded bg-purple-500/10 border border-purple-500/20" />
                      <div className="h-5 rounded bg-purple-500/10 border border-purple-500/20" />
                    </div>
                  </div>
                ))}
              </div>
              {/* XP bar preview */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-mono text-purple-400">Lv. 4 Pathfinder</span>
                <div className="flex-1 h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                  <div className="h-full w-3/5 bg-gradient-to-r from-purple-500 to-blue-400 rounded-full" />
                </div>
                <span className="text-xs font-mono text-[#555568]">420 XP</span>
              </div>
            </div>

            {/* Professional Mode Card */}
            <div className="relative rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-[#12121a] p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">&#x1F4CB;</span>
                <h3 className="text-lg font-semibold text-white">Professional Mode</h3>
              </div>
              <p className="text-sm text-[#8888a0] mb-5 leading-relaxed">
                Clean, minimal interface. Standard kanban columns. No XP, no levels&mdash;just focused task management with zero distractions.
              </p>
              {/* Mini board preview */}
              <div className="flex gap-2">
                {['Backlog', 'In Progress', 'Done'].map((col) => (
                  <div key={col} className="flex-1 rounded-lg bg-[#0a0a0f]/60 border border-[#2a2a3a] p-2">
                    <div className="text-xs font-medium text-blue-400/80 mb-1.5 font-mono">{col}</div>
                    <div className="space-y-1.5">
                      <div className="h-5 rounded bg-blue-500/10 border border-blue-500/20" />
                      <div className="h-5 rounded bg-blue-500/10 border border-blue-500/20" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Clean status bar preview */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-mono text-blue-400">Active 12</span>
                <span className="text-xs text-[#555568]">&middot;</span>
                <span className="text-xs font-mono text-[#555568]">Done 36</span>
                <span className="text-xs text-[#555568]">&middot;</span>
                <span className="text-xs font-mono text-[#555568]">Cycle Avg 2.4d</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="w-full max-w-4xl pb-20">
          <h2 className="text-center text-xl font-semibold text-white mb-2">Everything you need to ship</h2>
          <p className="text-center text-sm text-[#8888a0] mb-10">Available in both modes.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Drag & Drop Board', desc: 'Move cards across custom columns. Reorder with ease.' },
              { title: 'Epics & Categories', desc: 'Group related work. Tag and filter to keep focus.' },
              { title: 'Time Tracking', desc: 'Log time per card. See where your hours go.' },
              { title: 'Cycle Time Metrics', desc: 'Track how long cards take from start to done.' },
              { title: 'Card Templates', desc: 'Save and reuse card setups for recurring work.' },
              { title: 'Real-Time Sync', desc: 'Supabase-powered. Changes appear instantly everywhere.' },
              { title: 'Comments & Activity', desc: 'Threaded comments and a full activity changelog.' },
              { title: 'Card Relationships', desc: 'Link blockers, duplicates, and related cards.' },
              { title: 'Recurring Tasks', desc: 'Auto-create cards on a schedule. Never forget standups.' },
            ].map((f) => (
              <div key={f.title} className="text-left p-4 rounded-xl border border-[#1e1e2e] bg-[#12121a]/50 hover:border-[#2a2a3a] transition-colors">
                <div className="text-white font-medium text-sm mb-1">{f.title}</div>
                <div className="text-[#555568] text-xs leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full max-w-2xl text-center pb-20">
          <h2 className="text-xl font-semibold text-white mb-3">Ready to get organized?</h2>
          <p className="text-sm text-[#8888a0] mb-8">Free to use. Set up in under a minute.</p>
          <Link
            href="/auth/signup"
            className="inline-block px-10 py-3.5 bg-white text-[#0a0a0f] font-semibold rounded-lg hover:bg-[#e8e8f0] transition-all text-sm"
          >
            Get started free
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[#555568] text-xs border-t border-[#1e1e2e]">
        Built by Runeforge Labs
      </footer>
    </div>
  );
}
