export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  followedBanks: string[];
}

export interface TelegramSendResult {
  ok: boolean;
  description?: string;
}

export async function verifyTelegramBot(botToken: string): Promise<{
  ok: boolean;
  username?: string;
  description?: string;
}> {
  const clean = botToken.trim();
  if (!clean) return { ok: false, description: 'Token vacío' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(clean)}/getMe`);
    const data = (await res.json()) as {
      ok: boolean;
      result?: { username?: string };
      description?: string;
    };
    return {
      ok: data.ok,
      username: data.result?.username,
      description: data.description,
    };
  } catch (err) {
    return {
      ok: false,
      description: err instanceof Error ? err.message : 'Error de red',
    };
  }
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<TelegramSendResult> {
  const cleanToken = botToken.trim();
  const cleanChat = chatId.trim();
  if (!cleanToken || !cleanChat) {
    return { ok: false, description: 'Falta Bot Token o Chat ID' };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(cleanToken)}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChat,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      },
    );
    const data = (await res.json()) as TelegramSendResult;
    return data;
  } catch (err) {
    return {
      ok: false,
      description: err instanceof Error ? err.message : 'Error de red',
    };
  }
}

export async function detectTelegramChatId(botToken: string): Promise<{
  ok: boolean;
  chatId?: string;
  username?: string;
  description?: string;
}> {
  const clean = botToken.trim();
  if (!clean) return { ok: false, description: 'Token vacío' };
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(clean)}/getUpdates?limit=10`,
    );
    const data = (await res.json()) as {
      ok: boolean;
      result?: Array<{ message?: { chat?: { id?: number; username?: string; first_name?: string } } }>;
      description?: string;
    };
    if (!data.ok) return { ok: false, description: data.description };
    const chats = (data.result ?? [])
      .map((u) => u.message?.chat)
      .filter((c): c is { id: number; username?: string; first_name?: string } => Boolean(c?.id));
    if (chats.length === 0) {
      return {
        ok: false,
        description: 'Primero abre tu bot en Telegram y presiona Iniciar (/start).',
      };
    }
    const latest = chats[chats.length - 1];
    return {
      ok: true,
      chatId: String(latest.id),
      username: latest.username ?? latest.first_name,
    };
  } catch (err) {
    return {
      ok: false,
      description: err instanceof Error ? err.message : 'Error de red',
    };
  }
}
