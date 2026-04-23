# Discord Voice Keepalive Bot

Sits silently in a Discord voice channel 24/7 to keep it active.

---

## Setup

### 1. Create a Discord Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**
2. Name it anything (e.g. `keepalive`)
3. Go to **Bot** tab → click **Reset Token** → copy the token (this is your `DISCORD_BOT_TOKEN`)
4. Under **Privileged Gateway Intents**, enable **Server Members Intent**
5. Click **Save Changes**

### 2. Invite the Bot to Your Server

1. Go to **OAuth2 → URL Generator**
2. Under **Scopes**, check `bot`
3. Under **Voice Permissions**, check `Connect` and `Speak`
4. Copy the generated URL → open it in your browser → select your server → **Authorize**

### 3. Get Your IDs

In Discord, go to **Settings → Advanced → Enable Developer Mode**, then:

- Right-click your **server name** → **Copy Server ID** → `DISCORD_GUILD_ID`
- Right-click your **voice channel** → **Copy Channel ID** → `DISCORD_CHANNEL_ID`

### 4. Deploy to Railway (free, runs 24/7)

1. Fork or clone this repo to your GitHub
2. Go to [railway.app](https://railway.app) → sign in with GitHub
3. Click **New Project → Deploy from GitHub repo** → select this repo
4. Go to the **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `DISCORD_BOT_TOKEN` | your bot token from Step 1 |
| `DISCORD_GUILD_ID` | your server ID from Step 3 |
| `DISCORD_CHANNEL_ID` | your voice channel ID from Step 3 |

5. Click **Deploy** — the bot will appear in your voice channel within seconds

---

## Notes

- The bot is muted and deafened — it makes no sound and hears nothing
- If the connection drops (Railway restart, network blip), it automatically rejoins
- No messages are posted to any channel
- Requires Node.js 18+
