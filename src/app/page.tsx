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
          <span className="text-white font-semibold tracking-tight">Atlas Board</span>
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

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <AtlasLogo size={96} className="mx-auto shadow-2xl shadow-white/5" />
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-tight max-w-2xl">
          Your Project
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Command Center
          </span>
        </h1>

        <p className="mt-6 text-lg text-[#8888a0] max-w-md leading-relaxed">
          Organize, prioritize, and ship. A Kanban board built for developers who mean business.
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
            className="px-8 py-3 border border-[#2a2a3a] text-[#e8e8f0] font-medium rounded-lg hover:bg-[#12121a] hover:border-[#3a3a4a] transition-all text-sm"
          >
            Sign in
          </Link>
        </div>

        {/* Feature hints */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
          <div className="text-left p-4 rounded-xl border border-[#1e1e2e] bg-[#12121a]/50">
            <div className="text-white font-medium text-sm mb-1">Kanban Board</div>
            <div className="text-[#555568] text-xs leading-relaxed">Drag and drop cards across custom columns. Your workflow, your rules.</div>
          </div>
          <div className="text-left p-4 rounded-xl border border-[#1e1e2e] bg-[#12121a]/50">
            <div className="text-white font-medium text-sm mb-1">Epics & Categories</div>
            <div className="text-[#555568] text-xs leading-relaxed">Group work into epics. Tag with categories. Filter to focus.</div>
          </div>
          <div className="text-left p-4 rounded-xl border border-[#1e1e2e] bg-[#12121a]/50">
            <div className="text-white font-medium text-sm mb-1">Built for Speed</div>
            <div className="text-[#555568] text-xs leading-relaxed">Real-time Supabase backend. No loading spinners, just shipping.</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[#555568] text-xs border-t border-[#1e1e2e]">
        Built by Runeforge Labs
      </footer>
    </div>
  );
}
