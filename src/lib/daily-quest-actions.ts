import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface DailyQuest {
  id: string;
  user_id: string;
  board_id: string;
  date: string;
  quest_type: QuestType;
  label: string;
  target: number;
  progress: number;
  completed: boolean;
  xp_reward: number;
  completed_at: string | null;
  created_at: string;
}

export type QuestType =
  | 'complete_cards'
  | 'create_cards'
  | 'log_time'
  | 'clear_column'
  | 'complete_epic_card';

// Quest definitions — picked at random for each day
const QUEST_POOL: Array<{
  quest_type: QuestType;
  label: string;
  target: number;
  xp_reward: number;
}> = [
  { quest_type: 'complete_cards', label: 'Complete 3 quests today', target: 3, xp_reward: 75 },
  { quest_type: 'complete_cards', label: 'Complete 5 quests today', target: 5, xp_reward: 150 },
  { quest_type: 'create_cards', label: 'Add 3 new quests to your log', target: 3, xp_reward: 50 },
  { quest_type: 'log_time', label: 'Log time on 2 different quests', target: 2, xp_reward: 60 },
  { quest_type: 'complete_epic_card', label: 'Complete a quest tied to an epic', target: 1, xp_reward: 80 },
];

// Seeded random — same day always produces the same quests for a user
function seededPick(seed: string, pool: typeof QUEST_POOL, count: number) {
  // Simple hash for determinism
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const shuffled = [...pool].sort((a, b) => {
    const ha = (Math.imul(17, h) + a.quest_type.charCodeAt(0)) | 0;
    const hb = (Math.imul(17, h) + b.quest_type.charCodeAt(0)) | 0;
    return ha - hb;
  });
  // Deduplicate by quest_type
  const seen = new Set<string>();
  const result: typeof QUEST_POOL = [];
  for (const q of shuffled) {
    if (!seen.has(q.quest_type)) {
      seen.add(q.quest_type);
      result.push(q);
    }
    if (result.length === count) break;
  }
  return result;
}

// Get (or generate) today's quests for a user+board
export async function getTodayQuests(userId: string, boardId: string): Promise<DailyQuest[]> {
  const today = new Date().toISOString().slice(0, 10);

  // Try to fetch existing quests for today
  const { data: existing } = await supabase
    .from('daily_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('board_id', boardId)
    .eq('date', today)
    .order('created_at', { ascending: true });

  if (existing && existing.length > 0) {
    return existing as DailyQuest[];
  }

  // Generate 3 quests for today
  const seed = `${userId}-${today}`;
  const picks = seededPick(seed, QUEST_POOL, 3);

  const rows = picks.map(p => ({
    user_id: userId,
    board_id: boardId,
    date: today,
    quest_type: p.quest_type,
    label: p.label,
    target: p.target,
    progress: 0,
    completed: false,
    xp_reward: p.xp_reward,
  }));

  const { data: created, error } = await supabase
    .from('daily_quests')
    .insert(rows)
    .select();

  if (error) throw error;
  return (created || []) as DailyQuest[];
}

// Increment progress on matching quest types. Returns quests newly completed.
export async function incrementQuestProgress(
  userId: string,
  boardId: string,
  questType: QuestType,
  amount: number = 1,
): Promise<DailyQuest[]> {
  const today = new Date().toISOString().slice(0, 10);

  // Fetch matching incomplete quests for today
  const { data: quests } = await supabase
    .from('daily_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('board_id', boardId)
    .eq('date', today)
    .eq('quest_type', questType)
    .eq('completed', false);

  if (!quests || quests.length === 0) return [];

  const nowCompleted: DailyQuest[] = [];

  for (const q of quests as DailyQuest[]) {
    const newProgress = Math.min(q.progress + amount, q.target);
    const justCompleted = newProgress >= q.target;

    const { data: updated } = await supabase
      .from('daily_quests')
      .update({
        progress: newProgress,
        completed: justCompleted,
        completed_at: justCompleted ? new Date().toISOString() : null,
      })
      .eq('id', q.id)
      .select()
      .single();

    if (updated && justCompleted) {
      nowCompleted.push(updated as DailyQuest);
    }
  }

  return nowCompleted;
}
