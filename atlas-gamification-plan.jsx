import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

const COLORS = {
  bg: "#0a0a0f",
  surface: "#12121a",
  card: "#1a1a26",
  border: "#2a2a3a",
  text: "#e8e8f0",
  muted: "#888898",
  blue: "#4a9eff",
  purple: "#a855f7",
  green: "#34d399",
  orange: "#fb923c",
  red: "#f87171",
  yellow: "#fbbf24",
  cyan: "#22d3ee",
  pink: "#f472b6",
};

// XP Curve Data
function generateXPCurve(type, maxLevel = 50) {
  const data = [];
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    let xp;
    switch (type) {
      case "linear": xp = 100 * lvl; break;
      case "exponential": xp = Math.floor(100 * Math.pow(1.15, lvl - 1)); break;
      case "polynomial": xp = Math.floor(50 * Math.pow(lvl, 1.8)); break;
      case "atlas": xp = Math.floor(80 * Math.pow(lvl, 1.5) + 20 * lvl); break;
    }
    data.push({ level: lvl, xp });
  }
  return data;
}

// XP Actions
const XP_ACTIONS = [
  { action: "Create a card", xp: 5, category: "Create", icon: "+" },
  { action: "Move card to Done", xp: 25, category: "Complete", icon: "\u2713" },
  { action: "Complete a high-priority card", xp: 50, category: "Complete", icon: "\u2605" },
  { action: "Complete a critical card", xp: 75, category: "Complete", icon: "\u26A0" },
  { action: "Clear all cards from a column", xp: 100, category: "Complete", icon: "\uD83C\uDFC6" },
  { action: "Maintain daily streak (per day)", xp: 15, category: "Streak", icon: "\uD83D\uDD25" },
  { action: "7-day streak bonus", xp: 100, category: "Streak", icon: "\u26A1" },
  { action: "30-day streak bonus", xp: 500, category: "Streak", icon: "\uD83D\uDCA0" },
  { action: "Complete an epic (all cards done)", xp: 200, category: "Epic", icon: "\uD83D\uDFE3" },
  { action: "Archive 10 completed cards", xp: 50, category: "Cleanup", icon: "\uD83D\uDDC4" },
  { action: "Set due date + complete on time", xp: 35, category: "Discipline", icon: "\u23F0" },
  { action: "Complete card before due date", xp: 15, category: "Discipline", icon: "\u2B50" },
];

// Levels & Titles
const LEVEL_TITLES = [
  { level: 1, title: "Recruit", range: "1-4", color: COLORS.muted },
  { level: 5, title: "Apprentice", range: "5-9", color: COLORS.green },
  { level: 10, title: "Specialist", range: "10-19", color: COLORS.blue },
  { level: 20, title: "Strategist", range: "20-29", color: COLORS.purple },
  { level: 30, title: "Commander", range: "30-39", color: COLORS.orange },
  { level: 40, title: "Warlord", range: "40-49", color: COLORS.red },
  { level: 50, title: "Atlas Prime", range: "50", color: COLORS.yellow },
];

// Achievements / Badges
const BADGES = [
  { name: "First Blood", desc: "Complete your first card", icon: "\uD83D\uDDE1", tier: "bronze" },
  { name: "Hat Trick", desc: "Complete 3 cards in one day", icon: "\uD83C\uDFA9", tier: "bronze" },
  { name: "Streak Starter", desc: "Reach a 7-day streak", icon: "\uD83D\uDD25", tier: "bronze" },
  { name: "Epic Closer", desc: "Complete an entire epic", icon: "\uD83D\uDFE3", tier: "silver" },
  { name: "Speed Demon", desc: "Complete 5 cards before their due dates", icon: "\u26A1", tier: "silver" },
  { name: "Monthly Machine", desc: "Reach a 30-day streak", icon: "\uD83D\uDCAA", tier: "silver" },
  { name: "Board Cleaner", desc: "Archive 50 completed cards", icon: "\uD83E\uDDF9", tier: "silver" },
  { name: "Century Club", desc: "Complete 100 total cards", icon: "\uD83D\uDCAF", tier: "gold" },
  { name: "Iron Will", desc: "Reach a 90-day streak", icon: "\uD83D\uDEE1", tier: "gold" },
  { name: "Atlas Ascendant", desc: "Reach Level 50", icon: "\uD83D\uDC51", tier: "gold" },
  { name: "Zero Inbox", desc: "Clear every card on the board to Done", icon: "\u2728", tier: "gold" },
  { name: "Discipline King", desc: "Complete 25 cards on time in a row", icon: "\uD83C\uDF1F", tier: "legendary" },
];

// Octalysis mapping for Atlas Board
const OCTALYSIS_DATA = [
  { drive: "Epic Meaning", score: 6, impl: "Board themes, personal mission statement on profile" },
  { drive: "Accomplishment", score: 9, impl: "XP, levels, badges, progress bars, rank titles" },
  { drive: "Creativity", score: 7, impl: "Custom categories, board theming, epic planning" },
  { drive: "Ownership", score: 8, impl: "Collected badges, level history, personal stats" },
  { drive: "Social", score: 4, impl: "Future: shared boards, team challenges (Phase 2)" },
  { drive: "Scarcity", score: 5, impl: "Limited-time XP boosts, seasonal badges" },
  { drive: "Unpredictability", score: 6, impl: "Random bonus XP, mystery achievement reveals" },
  { drive: "Loss Avoidance", score: 7, impl: "Streaks, streak freeze tokens, decay warnings" },
];

// Implementation phases
const PHASES = [
  {
    phase: 1,
    title: "Core XP Engine",
    weeks: "1-2",
    color: COLORS.blue,
    tasks: [
      "DB migration: user_xp, user_levels, user_streaks tables",
      "XP calculation engine in board-actions.ts",
      "Level-up detection with XP curve formula",
      "Hook into card lifecycle (create, move, complete, archive)",
      "useGamification hook for state management",
      "XP toast notifications on earn",
    ],
  },
  {
    phase: 2,
    title: "Visual Progression",
    weeks: "3-4",
    color: COLORS.purple,
    tasks: [
      "XP bar in header (current level progress)",
      "Level-up celebration animation (confetti/glow)",
      "Rank title display next to username",
      "Daily streak counter with fire icon",
      "Streak calendar (GitHub-style contribution graph)",
      "Stats integration: XP earned this week/month",
    ],
  },
  {
    phase: 3,
    title: "Achievements & Badges",
    weeks: "5-6",
    color: COLORS.green,
    tasks: [
      "DB: user_badges table + badge definitions",
      "Achievement detection engine (event-driven)",
      "Badge showcase panel (profile section)",
      "Badge unlock animation + toast",
      "Achievement progress tracking (X/Y format)",
      "Tiered badges: Bronze, Silver, Gold, Legendary",
    ],
  },
  {
    phase: 4,
    title: "Engagement Loops",
    weeks: "7-8",
    color: COLORS.orange,
    tasks: [
      "Daily quest system (3 rotating objectives)",
      "Streak freeze tokens (earn or buy with XP)",
      "XP multiplier for consecutive completions",
      "Weekly summary stats email/notification",
      "Seasonal themes + limited-time badges",
      "Profile page with full progression history",
    ],
  },
];

// DB Schema preview
const DB_TABLES = [
  {
    name: "user_xp_events",
    columns: ["id (uuid)", "user_id (uuid)", "board_id (uuid)", "action (text)", "xp_amount (int)", "metadata (jsonb)", "created_at (timestamptz)"],
  },
  {
    name: "user_levels",
    columns: ["user_id (uuid, PK)", "current_xp (int)", "current_level (int)", "title (text)", "updated_at (timestamptz)"],
  },
  {
    name: "user_streaks",
    columns: ["user_id (uuid, PK)", "current_streak (int)", "longest_streak (int)", "last_active_date (date)", "freeze_tokens (int)", "updated_at (timestamptz)"],
  },
  {
    name: "user_badges",
    columns: ["id (uuid)", "user_id (uuid)", "badge_key (text)", "earned_at (timestamptz)", "progress (jsonb)"],
  },
];

// Tabs
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "xp", label: "XP System" },
  { id: "levels", label: "Levels & Ranks" },
  { id: "badges", label: "Badges" },
  { id: "streaks", label: "Streaks" },
  { id: "psychology", label: "Psychology" },
  { id: "roadmap", label: "Roadmap" },
  { id: "database", label: "Database" },
];

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border p-5 ${className}`} style={{ background: COLORS.card, borderColor: COLORS.border }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, color = COLORS.blue }) {
  return (
    <div className="rounded-lg border p-4 text-center" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="text-3xl font-bold" style={{ color, fontFamily: "JetBrains Mono, monospace" }}>{value}</div>
      <div className="text-sm mt-1 font-semibold" style={{ color: COLORS.text }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.text, fontFamily: "Space Grotesk, sans-serif" }}>{children}</h2>;
}

function BadgeCard({ badge }) {
  const tierColors = { bronze: "#cd7f32", silver: "#c0c0c0", gold: COLORS.yellow, legendary: COLORS.purple };
  return (
    <div className="rounded-lg border p-3 flex items-start gap-3" style={{ background: COLORS.surface, borderColor: tierColors[badge.tier] + "60" }}>
      <span className="text-2xl">{badge.icon}</span>
      <div>
        <div className="font-semibold text-sm" style={{ color: tierColors[badge.tier] }}>{badge.name}</div>
        <div className="text-xs" style={{ color: COLORS.muted }}>{badge.desc}</div>
        <span className="text-[10px] uppercase tracking-wider font-bold mt-1 inline-block px-1.5 py-0.5 rounded" style={{ background: tierColors[badge.tier] + "20", color: tierColors[badge.tier] }}>{badge.tier}</span>
      </div>
    </div>
  );
}

// Mock streak calendar
function StreakCalendar() {
  const weeks = 20;
  const days = 7;
  const data = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < days; d++) {
      const intensity = Math.random();
      data.push({ week: w, day: d, val: intensity > 0.3 ? (intensity > 0.6 ? (intensity > 0.85 ? 3 : 2) : 1) : 0 });
    }
  }
  const intensityColors = ["#1a1a26", "#1a3a2e", "#2a6a4e", "#34d399"];
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: weeks }, (_, w) => (
        <div key={w} className="flex flex-col gap-0.5">
          {Array.from({ length: days }, (_, d) => {
            const cell = data.find(c => c.week === w && c.day === d);
            return <div key={d} className="w-3 h-3 rounded-sm" style={{ background: intensityColors[cell?.val || 0] }} title={`${cell?.val || 0} tasks completed`} />;
          })}
        </div>
      ))}
    </div>
  );
}

// Simulated XP progress bar
function XPBar({ level = 12, progress = 0.65 }) {
  const title = LEVEL_TITLES.findLast(t => t.level <= level) || LEVEL_TITLES[0];
  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: title.color, fontFamily: "JetBrains Mono, monospace" }}>Lv.{level}</span>
          <span className="text-sm font-semibold" style={{ color: title.color }}>{title.title}</span>
        </div>
        <span className="text-xs" style={{ color: COLORS.muted }}>1,247 / 1,920 XP</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.purple})` }} />
      </div>
    </div>
  );
}

export default function GamificationDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [curveType, setCurveType] = useState("atlas");

  const curveData = useMemo(() => generateXPCurve(curveType), [curveType]);
  const allCurves = useMemo(() => {
    const atlas = generateXPCurve("atlas");
    const exp = generateXPCurve("exponential");
    const poly = generateXPCurve("polynomial");
    const lin = generateXPCurve("linear");
    return atlas.map((d, i) => ({
      level: d.level,
      atlas: d.xp,
      exponential: exp[i].xp,
      polynomial: poly[i].xp,
      linear: lin[i].xp,
    }));
  }, []);

  const xpByCategory = useMemo(() => {
    const cats = {};
    XP_ACTIONS.forEach(a => {
      if (!cats[a.category]) cats[a.category] = { category: a.category, totalXP: 0, count: 0 };
      cats[a.category].totalXP += a.xp;
      cats[a.category].count++;
    });
    return Object.values(cats);
  }, []);

  return (
    <div className="min-h-screen p-6" style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "Space Grotesk, sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">&#x1F3AE;</span>
            <h1 className="text-3xl font-bold" style={{ background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Atlas Board: Gamification System
            </h1>
          </div>
          <p style={{ color: COLORS.muted }}>XP, Levels, Badges, Streaks — turning task completion into progression</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                background: activeTab === t.id ? COLORS.blue + "20" : "transparent",
                color: activeTab === t.id ? COLORS.blue : COLORS.muted,
                border: `1px solid ${activeTab === t.id ? COLORS.blue + "40" : "transparent"}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ============ OVERVIEW ============ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBox label="XP Actions" value="12" sub="unique earning events" color={COLORS.blue} />
              <StatBox label="Badges" value="12" sub="4 tiers" color={COLORS.yellow} />
              <StatBox label="Max Level" value="50" sub="Atlas Prime" color={COLORS.purple} />
              <StatBox label="Build Phases" value="4" sub="~8 weeks" color={COLORS.green} />
            </div>

            <Card>
              <SectionTitle>Live Preview: XP Header Bar</SectionTitle>
              <XPBar level={12} progress={0.65} />
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">&#x1F525;</span>
                  <span className="font-bold" style={{ color: COLORS.orange, fontFamily: "JetBrains Mono, monospace" }}>14</span>
                  <span className="text-xs" style={{ color: COLORS.muted }}>day streak</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">&#x1F3C6;</span>
                  <span className="font-bold" style={{ color: COLORS.yellow, fontFamily: "JetBrains Mono, monospace" }}>7</span>
                  <span className="text-xs" style={{ color: COLORS.muted }}>badges earned</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">&#x2B50;</span>
                  <span className="font-bold" style={{ color: COLORS.green, fontFamily: "JetBrains Mono, monospace" }}>847</span>
                  <span className="text-xs" style={{ color: COLORS.muted }}>XP this week</span>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle>Design Philosophy</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { title: "White Hat First", desc: "Progression should feel empowering, not addictive. Focus on accomplishment, creativity, and ownership \u2014 the positive Octalysis drives.", color: COLORS.green },
                  { title: "Earned, Not Given", desc: "XP requires real effort. No participation trophies. High-priority and on-time completions earn significantly more than basic actions.", color: COLORS.blue },
                  { title: "Visible but Not Noisy", desc: "XP bar always visible. Level-ups celebrate. But gamification never blocks workflow \u2014 it enhances it from the margins.", color: COLORS.purple },
                ].map((p, i) => (
                  <div key={i} className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: p.color + "40" }}>
                    <div className="font-bold text-sm mb-1" style={{ color: p.color }}>{p.title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle>Inspiration Sources</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { name: "Duolingo", what: "Streaks, leagues, XP boosts", stat: "+60% engagement" },
                  { name: "Habitica", what: "RPG overlay on tasks, HP/XP/gold", stat: "Full RPG system" },
                  { name: "GitHub", what: "Contribution graph, subtle streaks", stat: "Visual consistency" },
                  { name: "Todoist", what: "Karma points, level titles", stat: "Light gamification" },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg border p-3" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                    <div className="font-bold text-sm" style={{ color: COLORS.text }}>{s.name}</div>
                    <div className="text-xs mt-1" style={{ color: COLORS.muted }}>{s.what}</div>
                    <div className="text-xs mt-1 font-semibold" style={{ color: COLORS.blue }}>{s.stat}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ============ XP SYSTEM ============ */}
        {activeTab === "xp" && (
          <div className="space-y-6">
            <Card>
              <SectionTitle>XP Earning Actions</SectionTitle>
              <div className="space-y-2">
                {XP_ACTIONS.map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg px-4 py-2.5 border" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center">{a.icon}</span>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: COLORS.text }}>{a.action}</div>
                        <div className="text-xs" style={{ color: COLORS.muted }}>{a.category}</div>
                      </div>
                    </div>
                    <div className="font-bold text-lg" style={{ color: COLORS.green, fontFamily: "JetBrains Mono, monospace" }}>+{a.xp} XP</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle>XP by Category</SectionTitle>
              <div style={{ height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={xpByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="category" tick={{ fill: COLORS.muted, fontSize: 11 }} />
                    <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
                    <Bar dataKey="totalXP" name="Total XP Available" radius={[6, 6, 0, 0]}>
                      {xpByCategory.map((_, i) => <Cell key={i} fill={[COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple, COLORS.cyan, COLORS.yellow][i % 6]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <SectionTitle>XP Multiplier System</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { title: "Streak Multiplier", desc: "1.0x base \u2192 1.5x at 7 days \u2192 2.0x at 30 days. Multiplies all XP earned while streak is active.", color: COLORS.orange },
                  { title: "Combo Bonus", desc: "Complete 3+ cards in one session: +10% per card after the 3rd. Rewards focused deep work.", color: COLORS.blue },
                  { title: "Priority Weight", desc: "Low = 1.0x, Medium = 1.25x, High = 1.5x, Critical = 2.0x. Higher stakes = higher rewards.", color: COLORS.red },
                ].map((m, i) => (
                  <div key={i} className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: m.color + "40" }}>
                    <div className="font-bold text-sm mb-2" style={{ color: m.color }}>{m.title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ============ LEVELS & RANKS ============ */}
        {activeTab === "levels" && (
          <div className="space-y-6">
            <Card>
              <SectionTitle>XP Curve Comparison</SectionTitle>
              <div className="flex gap-2 mb-4 flex-wrap">
                {["atlas", "exponential", "polynomial", "linear"].map(t => (
                  <button key={t} onClick={() => setCurveType(t)} className="px-3 py-1 rounded text-xs font-semibold capitalize" style={{ background: curveType === t ? COLORS.blue : COLORS.surface, color: curveType === t ? "#fff" : COLORS.muted, border: `1px solid ${COLORS.border}` }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={allCurves}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="level" tick={{ fill: COLORS.muted, fontSize: 10 }} label={{ value: "Level", position: "insideBottom", offset: -5, fill: COLORS.muted }} />
                    <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} label={{ value: "XP to Next Level", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 12 }} />
                    <Line type="monotone" dataKey="atlas" stroke={COLORS.blue} strokeWidth={curveType === "atlas" ? 3 : 1} dot={false} name="Atlas (Recommended)" opacity={curveType === "atlas" ? 1 : 0.3} />
                    <Line type="monotone" dataKey="exponential" stroke={COLORS.green} strokeWidth={curveType === "exponential" ? 3 : 1} dot={false} name="Exponential" opacity={curveType === "exponential" ? 1 : 0.3} />
                    <Line type="monotone" dataKey="polynomial" stroke={COLORS.orange} strokeWidth={curveType === "polynomial" ? 3 : 1} dot={false} name="Polynomial" opacity={curveType === "polynomial" ? 1 : 0.3} />
                    <Line type="monotone" dataKey="linear" stroke={COLORS.red} strokeWidth={curveType === "linear" ? 3 : 1} dot={false} name="Linear" opacity={curveType === "linear" ? 1 : 0.3} />
                    <Legend wrapperStyle={{ fontSize: 11, color: COLORS.muted }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs p-3 rounded-lg" style={{ background: COLORS.surface, color: COLORS.muted }}>
                <strong style={{ color: COLORS.blue }}>Atlas Curve Formula:</strong>{" "}
                <code style={{ fontFamily: "JetBrains Mono, monospace", color: COLORS.green }}>XP(level) = 80 * level^1.5 + 20 * level</code>
                <span className="block mt-1">Hybrid polynomial — fast early levels for quick dopamine, gradually steeper to reward dedication without feeling grindy.</span>
              </div>
            </Card>

            <Card>
              <SectionTitle>Rank Progression</SectionTitle>
              <div className="space-y-2">
                {LEVEL_TITLES.map((t, i) => {
                  const nextTitle = LEVEL_TITLES[i + 1];
                  const span = nextTitle ? nextTitle.level - t.level : 10;
                  return (
                    <div key={i} className="flex items-center gap-4 rounded-lg border px-4 py-3" style={{ background: COLORS.surface, borderColor: t.color + "30" }}>
                      <div className="w-16 text-center">
                        <div className="text-2xl font-bold" style={{ color: t.color, fontFamily: "JetBrains Mono, monospace" }}>{t.range}</div>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold" style={{ color: t.color }}>{t.title}</div>
                        <div className="w-full h-1.5 rounded-full mt-1" style={{ background: COLORS.border }}>
                          <div className="h-full rounded-full" style={{ width: `${(span / 50) * 100}%`, background: t.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ============ BADGES ============ */}
        {activeTab === "badges" && (
          <div className="space-y-6">
            {["bronze", "silver", "gold", "legendary"].map(tier => (
              <Card key={tier}>
                <SectionTitle>{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</SectionTitle>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {BADGES.filter(b => b.tier === tier).map((b, i) => <BadgeCard key={i} badge={b} />)}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ============ STREAKS ============ */}
        {activeTab === "streaks" && (
          <div className="space-y-6">
            <Card>
              <SectionTitle>Streak System Design</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                  <div className="text-sm font-bold mb-2" style={{ color: COLORS.orange }}>How Streaks Work</div>
                  <ul className="space-y-2 text-xs" style={{ color: COLORS.muted }}>
                    <li><strong style={{ color: COLORS.text }}>Trigger:</strong> Complete at least 1 card per day</li>
                    <li><strong style={{ color: COLORS.text }}>Reset:</strong> Miss a full calendar day with no completions</li>
                    <li><strong style={{ color: COLORS.text }}>Freeze:</strong> Spend 1 token to protect a missed day (max 2 stored)</li>
                    <li><strong style={{ color: COLORS.text }}>Earn tokens:</strong> 1 freeze token at 7-day streak, another at 14</li>
                    <li><strong style={{ color: COLORS.text }}>Multiplier:</strong> XP multiplier scales with streak length</li>
                  </ul>
                </div>
                <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                  <div className="text-sm font-bold mb-2" style={{ color: COLORS.orange }}>Streak Milestones</div>
                  <div className="space-y-2">
                    {[
                      { days: 3, reward: "Unlock streak display on board", mult: "1.1x" },
                      { days: 7, reward: "+100 XP bonus + 1 freeze token", mult: "1.25x" },
                      { days: 14, reward: "+200 XP bonus + 1 freeze token", mult: "1.5x" },
                      { days: 30, reward: "+500 XP bonus + Monthly Machine badge", mult: "1.75x" },
                      { days: 90, reward: "+1500 XP bonus + Iron Will badge", mult: "2.0x" },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold" style={{ color: COLORS.orange, fontFamily: "JetBrains Mono, monospace" }}>{m.days}d</span>
                          <span style={{ color: COLORS.muted }}>{m.reward}</span>
                        </div>
                        <span className="font-bold" style={{ color: COLORS.green, fontFamily: "JetBrains Mono, monospace" }}>{m.mult}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle>Contribution Graph Preview (GitHub-style)</SectionTitle>
              <StreakCalendar />
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs" style={{ color: COLORS.muted }}>Less</span>
                {["#1a1a26", "#1a3a2e", "#2a6a4e", "#34d399"].map((c, i) => <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />)}
                <span className="text-xs" style={{ color: COLORS.muted }}>More</span>
              </div>
            </Card>

            <Card>
              <SectionTitle>Why Streaks Work (Research-Backed)</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { stat: "3.6x", desc: "Users with 7-day streaks are 3.6x more likely to stay engaged long-term (Duolingo data)" },
                  { stat: "60%", desc: "Streak visibility (always-on counter) increases commitment by 60%" },
                  { stat: "21%", desc: "Streak freeze reduces churn by 21% for users who would otherwise break their streak" },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg border p-4 text-center" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                    <div className="text-2xl font-bold" style={{ color: COLORS.blue, fontFamily: "JetBrains Mono, monospace" }}>{s.stat}</div>
                    <div className="text-xs mt-2" style={{ color: COLORS.muted }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ============ PSYCHOLOGY ============ */}
        {activeTab === "psychology" && (
          <div className="space-y-6">
            <Card>
              <SectionTitle>Octalysis Framework: Atlas Board Mapping</SectionTitle>
              <p className="text-xs mb-4" style={{ color: COLORS.muted }}>Yu-kai Chou's 8 Core Drives scored 1-10 for how we'll leverage each in Atlas Board</p>
              <div style={{ height: 350 }}>
                <ResponsiveContainer>
                  <RadarChart data={OCTALYSIS_DATA}>
                    <PolarGrid stroke={COLORS.border} />
                    <PolarAngleAxis dataKey="drive" tick={{ fill: COLORS.muted, fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: COLORS.muted, fontSize: 9 }} />
                    <Radar name="Atlas Board" dataKey="score" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <SectionTitle>How Each Drive Maps to Features</SectionTitle>
              <div className="space-y-2">
                {OCTALYSIS_DATA.map((d, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border px-4 py-3" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                    <div className="w-20">
                      <div className="text-xs font-bold" style={{ color: COLORS.blue }}>{d.drive}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: COLORS.border }}>
                          <div className="h-full rounded-full" style={{ width: `${d.score * 10}%`, background: d.score >= 7 ? COLORS.green : d.score >= 5 ? COLORS.yellow : COLORS.red }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }}>{d.score}</span>
                      </div>
                    </div>
                    <div className="flex-1 text-xs" style={{ color: COLORS.muted }}>{d.impl}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle>Anti-Patterns We're Avoiding</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { bad: "Shallow PBL", desc: "Points/badges/leaderboards alone don't sustain engagement. We tie every reward to meaningful accomplishment." },
                  { bad: "Punishment-heavy", desc: "No HP loss, no harsh penalties. Streak breaks reset multiplier but don't take away earned XP." },
                  { bad: "Pay-to-win", desc: "No purchasable XP. Every point is earned through real task completion." },
                  { bad: "Notification spam", desc: "Level-up toasts only. No push notifications, no guilt-tripping, no dark patterns." },
                ].map((a, i) => (
                  <div key={i} className="rounded-lg border p-3" style={{ background: COLORS.surface, borderColor: COLORS.red + "30" }}>
                    <div className="text-sm font-bold" style={{ color: COLORS.red }}>{a.bad}</div>
                    <div className="text-xs mt-1" style={{ color: COLORS.muted }}>{a.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ============ ROADMAP ============ */}
        {activeTab === "roadmap" && (
          <div className="space-y-6">
            {PHASES.map((p, pi) => (
              <Card key={pi}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: p.color + "20", color: p.color, fontFamily: "JetBrains Mono, monospace" }}>Phase {p.phase}</span>
                  <SectionTitle>{p.title}</SectionTitle>
                  <span className="ml-auto text-xs" style={{ color: COLORS.muted }}>Weeks {p.weeks}</span>
                </div>
                <div className="space-y-2">
                  {p.tasks.map((t, ti) => (
                    <div key={ti} className="flex items-center gap-3 rounded-lg px-4 py-2 border" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                      <div className="w-5 h-5 rounded border-2 flex-shrink-0" style={{ borderColor: p.color + "60" }} />
                      <span className="text-sm" style={{ color: COLORS.text }}>{t}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            <Card>
              <SectionTitle>Timeline Overview</SectionTitle>
              <div className="flex items-center gap-1">
                {PHASES.map((p, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="h-3 rounded-full" style={{ background: p.color }} />
                    <div className="text-[10px] mt-1 font-bold" style={{ color: p.color }}>P{p.phase}</div>
                    <div className="text-[9px]" style={{ color: COLORS.muted }}>Wk {p.weeks}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ============ DATABASE ============ */}
        {activeTab === "database" && (
          <div className="space-y-6">
            <Card>
              <SectionTitle>New Database Tables</SectionTitle>
              <p className="text-xs mb-4" style={{ color: COLORS.muted }}>All tables use RLS with user_id = auth.uid() policies. Foreign keys cascade on user deletion.</p>
              {DB_TABLES.map((t, ti) => (
                <div key={ti} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: COLORS.purple + "20", color: COLORS.purple, fontFamily: "JetBrains Mono, monospace" }}>{t.name}</span>
                  </div>
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: COLORS.border }}>
                    {t.columns.map((c, ci) => (
                      <div key={ci} className="flex items-center px-4 py-1.5 border-b last:border-b-0 text-xs" style={{ background: ci % 2 === 0 ? COLORS.surface : COLORS.card, borderColor: COLORS.border }}>
                        <code style={{ fontFamily: "JetBrains Mono, monospace", color: COLORS.green }}>{c}</code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <SectionTitle>XP Calculation Pseudocode</SectionTitle>
              <pre className="rounded-lg p-4 text-xs overflow-x-auto" style={{ background: COLORS.surface, fontFamily: "JetBrains Mono, monospace", color: COLORS.green }}>
{`// On card moved to Done column
async function awardCardCompletionXP(card, userId) {
  const baseXP = 25;

  // Priority multiplier
  const priorityMult = {
    low: 1.0, medium: 1.25, high: 1.5, critical: 2.0
  }[card.priority] ?? 1.0;

  // On-time bonus
  const onTimeBonus = card.due_date &&
    new Date(card.due_date) >= new Date() ? 35 : 0;
  const earlyBonus = card.due_date &&
    new Date(card.due_date) > addDays(new Date(), 1) ? 15 : 0;

  // Streak multiplier
  const streak = await getUserStreak(userId);
  const streakMult = streak >= 30 ? 1.75
    : streak >= 14 ? 1.5
    : streak >= 7 ? 1.25
    : streak >= 3 ? 1.1
    : 1.0;

  const totalXP = Math.floor(
    (baseXP * priorityMult + onTimeBonus + earlyBonus)
    * streakMult
  );

  await recordXPEvent(userId, 'card_complete', totalXP);
  await checkLevelUp(userId);
  await checkBadgeProgress(userId);
  await updateStreak(userId);
}`}
              </pre>
            </Card>

            <Card>
              <SectionTitle>Level-Up Formula</SectionTitle>
              <pre className="rounded-lg p-4 text-xs overflow-x-auto" style={{ background: COLORS.surface, fontFamily: "JetBrains Mono, monospace", color: COLORS.green }}>
{`// XP required for a given level
function xpForLevel(level: number): number {
  return Math.floor(80 * Math.pow(level, 1.5) + 20 * level);
}

// Total XP to reach a level from 0
function totalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

// Sample progression:
// Lv 1:  100 XP  | Lv 5:   453 XP  | Lv 10: 1,131 XP
// Lv 20: 2,973 XP | Lv 30: 5,243 XP | Lv 50: 10,928 XP`}
              </pre>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
