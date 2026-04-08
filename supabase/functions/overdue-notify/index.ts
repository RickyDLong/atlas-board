// @deno-types="npm:@supabase/supabase-js@2.39.0"
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OverdueCard {
  id: string;
  title: string;
  due_date: string;
  board_id: string;
  board_name: string;
}

interface UserOverdueData {
  user_id: string;
  email: string;
  notification_time: string;
  cards: OverdueCard[];
}

async function getOverdueCards(): Promise<UserOverdueData[]> {
  const today = new Date().toISOString().split('T')[0];

  // Get all users with overdue notifications enabled
  const { data: preferences, error: prefError } = await supabase
    .from('user_preferences')
    .select('user_id, notification_email, notification_time')
    .eq('overdue_notifications', true);

  if (prefError) {
    console.error('Error fetching preferences:', prefError);
    return [];
  }

  const userOverdueMap = new Map<string, UserOverdueData>();

  for (const pref of preferences) {
    const { user_id, notification_email, notification_time } = pref;

    // Get user's auth email if not overridden
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('email')
      .eq('id', user_id)
      .single();

    if (userError) {
      console.warn(`Could not fetch email for user ${user_id}:`, userError);
      continue;
    }

    const email = notification_email || userData?.email;
    if (!email) {
      console.warn(`No email found for user ${user_id}`);
      continue;
    }

    // Get boards for this user
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id, name')
      .eq('user_id', user_id);

    if (boardsError) {
      console.warn(`Could not fetch boards for user ${user_id}:`, boardsError);
      continue;
    }

    // For each board, find overdue cards
    for (const board of boards) {
      // Get the "done" column (last by position)
      const { data: columns, error: colError } = await supabase
        .from('columns')
        .select('id, position')
        .eq('board_id', board.id)
        .order('position', { ascending: false })
        .limit(1);

      if (colError) {
        console.warn(`Could not fetch columns for board ${board.id}:`, colError);
        continue;
      }

      const doneColumnId = columns && columns.length > 0 ? columns[0].id : null;

      // Find overdue cards (due_date < today, not archived, not in done column)
      let query = supabase
        .from('cards')
        .select('id, title, due_date')
        .eq('board_id', board.id)
        .lt('due_date', today)
        .is('archived_at', null);

      if (doneColumnId) {
        query = query.neq('column_id', doneColumnId);
      }

      const { data: cards, error: cardsError } = await query;

      if (cardsError) {
        console.warn(`Could not fetch cards for board ${board.id}:`, cardsError);
        continue;
      }

      if (cards && cards.length > 0) {
        const key = user_id;
        if (!userOverdueMap.has(key)) {
          userOverdueMap.set(key, {
            user_id,
            email,
            notification_time,
            cards: [],
          });
        }

        const userData = userOverdueMap.get(key)!;
        const formattedCards = cards.map(card => ({
          ...card,
          board_name: board.name,
        }));
        userData.cards.push(...formattedCards);
      }
    }
  }

  return Array.from(userOverdueMap.values());
}

function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function generateEmailHtml(userName: string, cards: OverdueCard[]): string {
  const cardsByBoard = cards.reduce(
    (acc: Record<string, OverdueCard[]>, card: OverdueCard) => {
      if (!acc[card.board_name]) {
        acc[card.board_name] = [];
      }
      acc[card.board_name].push(card);
      return acc;
    },
    {} as Record<string, OverdueCard[]>
  );

  const boardSections = Object.entries(cardsByBoard)
    .map(([boardName, boardCards]) => {
      const cardRows = boardCards
        .map(card => {
          const daysOverdue = calculateDaysOverdue(card.due_date);
          return `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #2a2a3a;">
                <span style="color: #e8e8f0; font-size: 13px;">${escapeHtml(card.title)}</span>
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #2a2a3a; text-align: right;">
                <span style="color: #fbbf24; font-size: 12px;">${new Date(card.due_date).toLocaleDateString()}</span>
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #2a2a3a; text-align: right;">
                <span style="color: #f87171; font-size: 12px;">${daysOverdue}d overdue</span>
              </td>
            </tr>
          `;
        })
        .join('');

      return `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #4a9eff; font-size: 14px; margin: 0 0 10px 0;">${escapeHtml(boardName)}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${cardRows}
          </table>
        </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: #0a0a0f;
      color: #e8e8f0;
      padding: 20px;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #12121a;
      border: 1px solid #2a2a3a;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #4a9eff 0%, #a855f7 100%);
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 20px;
    }
    .greeting {
      font-size: 14px;
      margin-bottom: 15px;
      line-height: 1.6;
    }
    .cta-button {
      display: inline-block;
      background: #4a9eff;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      margin-top: 20px;
    }
    .footer {
      background: #1a1a26;
      padding: 15px 20px;
      font-size: 12px;
      color: #555568;
      border-top: 1px solid #2a2a3a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Atlas Board</h1>
    </div>
    <div class="content">
      <div class="greeting">
        Hi ${escapeHtml(userName || 'there')},<br>
        <br>
        You have <strong>${cards.length}</strong> overdue card${cards.length !== 1 ? 's' : ''} on your board. Time to catch up!
      </div>
      <div style="background: #1a1a26; padding: 15px; border-radius: 6px; margin: 15px 0;">
        ${boardSections}
      </div>
      <p style="font-size: 13px; color: #555568; margin: 15px 0 0 0;">
        Log in to Atlas Board to prioritize and complete these tasks.
      </p>
      <a href="https://atlas-board.vercel.app" class="cta-button">Open Atlas Board</a>
    </div>
    <div class="footer">
      <p style="margin: 0;">
        This is an automated notification from Atlas Board. You can disable these notifications in your settings.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!resendApiKey) {
    console.log(`[TEST] Would send email to ${to}:`);
    console.log(`       Subject: ${subject}`);
    console.log(`       HTML: ${html.slice(0, 100)}...`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'notifications@atlas-board.app',
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log(`Email sent to ${to}:`, result);
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    console.log('Starting overdue notifications job...');

    const userOverdueData = await getOverdueCards();
    console.log(`Found ${userOverdueData.length} users with overdue cards`);

    let emailsSent = 0;
    let errors = 0;

    for (const userData of userOverdueData) {
      try {
        const userName = userData.email.split('@')[0];
        const subject = `Atlas Board: You have ${userData.cards.length} overdue card${userData.cards.length !== 1 ? 's' : ''}`;
        const html = generateEmailHtml(userName, userData.cards);

        await sendEmailViaResend(userData.email, subject, html);
        emailsSent++;
      } catch (err) {
        console.error(`Failed to send email for user ${userData.user_id}:`, err);
        errors++;
      }
    }

    console.log(`Overdue notifications completed: ${emailsSent} sent, ${errors} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        users_with_overdue: userOverdueData.length,
        emails_sent: emailsSent,
        errors,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({
        error: String(err),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
