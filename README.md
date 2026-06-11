# Corner Systems Website

A polished one-page React/Vite website for Corner Systems, focused on reception, automation, and lead systems for service businesses.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The main site lives in `src/App.jsx` and `src/styles.css`. The generated hero image is stored at `public/assets/combat-gym-systems-hero.png`.

## ElevenLabs assistant

The public Corner Systems ElevenLabs agent is embedded site-wide in `index.html`.

Current agent ID:

```text
agent_7601ksvg46h3fsm8zc264rs9s1wm
```

The ElevenLabs widget requires the agent to be public with authentication disabled in the ElevenLabs dashboard. For production, configure the agent allowlist to include the deployed Corner Systems domain.

## Custom CRM

Corner Systems should use a custom CRM for the agent network, not HubSpot. The canonical `cs_*` ElevenLabs tool contracts live in `/home/michael/cornersystems/agent-network/config/tool-schemas.json`; website API routes should implement or stub those contracts and return explicit `configured: false` responses for anything not live yet.

The internal CRM login entry point is `/crm`. It is a UI placeholder until real server-side authentication and the custom CRM backend are connected.
