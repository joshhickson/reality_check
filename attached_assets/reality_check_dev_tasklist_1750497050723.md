# Reality Check – Dev Foundation Tasklist for Claude Agent

> **Audience:** Claude 4 agent with full read/write access to the GitHub repository\
> **Goal:** Scaffold a clean, modular codebase that supports card‑skin overlays, player ID skins, and all baseline systems needed for Casual Mode play‑testing.

---

## 1. Repo Structure

```text
root/
 ├─ public/
 │   ├─ index.html          # minimal host page
 │   └─ assets/
 │       ├─ card_skins/     # PNG/SVG templates for card fronts
 │       └─ avatars/        # default player ID skins
 ├─ src/
 │   ├─ cards/
 │   │   ├─ sin.csv         #   > 10 starter rows
 │   │   ├─ virtue.csv      #   > 10 starter rows
 │   │   └─ parser.ts       # converts CSV → JSON deck
 │   ├─ skins/
 │   │   ├─ CardSkin.ts     # overlay renderer
 │   │   └─ AvatarSkin.ts   # player ID renderer
 │   ├─ engine/
 │   │   ├─ stateMachine.ts # finite‑state engine (turn, tile, decision)
 │   │   ├─ scheduler.ts    # ring clocks + global event queue
 │   │   └─ timer.ts        # 30‑second countdown w/ auto‑resolve
 │   ├─ board/
 │   │   ├─ hypocycloid.ts  # generate coordinates
 │   │   └─ render.ts       # draws base + personal overlays
 │   └─ index.ts            # entry; wires modules together
 ├─ design/
 │   ├─ wireframe.png       # (placeholder)
 │   └─ sample_turn.md      # narrative log
 ├─ schemas/
 │   ├─ CardDeck.d.ts
 │   └─ Modifiers.d.ts
 ├─ PLAYTEST.md             # local setup + feedback template
 ├─ README.md               # repo overview
 └─ package.json            # Vite + TS + Prettier
```

---

## 2. Tasks for Claude

### A. **Card CSV → JSON Parser**

1. Read `src/cards/*.csv`. Expected columns:
   ```csv
   id,deck,type,text,money,mental,sin,virtue,delay
   ```
2. Export two JSON arrays (`sin.json`, `virtue.json`) in `dist/`.
3. Auto‑watch for CSV changes during dev.

### B. **Card Skin Overlay Renderer**

1. Load `card_skins/*.svg`.
2. Given a card object + skin ID, draw text into predefined `<text>` placeholders.
3. Expose `renderCard(card, skin)` that returns a data‑URI `<img>`.

### C. **Player Avatar Skins**

*Same pattern as cards—render name + trait icons onto avatar SVG.*

### D. **State Machine Stub**

Implement minimal states:

- `Idle → Roll → Tile → Card → Decision → EndTurn`.

Transitions must include:

- Auto‑transition on timer expiry.
- Hook for ring scheduler to inject tile events.

### E. **Ring Scheduler**

Create clocks: `{ career:4, health:6, social:8, personal:10, babel:12 }` (turn units). Expose `getActiveEvents(turnNumber)`.

### F. **Board Rendering**

1. Use `hypocycloid.ts` to generate poly‑point paths.
2. `render.ts` draws base rings + calls `renderPlayerOverlay(mods)`.
3. Tile markers rendered as `<circle>` with data‑attrs for hit‑testing.

### G. **Timer Module**

Simple reactive store with `start(30s)`, `onExpire(cb)`.

---

## 3. Initial Data Seeds

- Include **10 sample Sin cards** and **10 sample Virtue cards**. Pull text from the design doc (embezzlement, therapy breakthrough, etc.).
- Add **default card skin SVGs**: simple rounded rectangle, colored header bar.
- Add **basic avatar skin SVG**: silhouette with label placeholders.

---

## 4. Play‑Test Script (`PLAYTEST.md`)

1. Clone repo → `npm i` → `npm run dev` (Vite).
2. Open browser at `localhost:5173`.
3. Host clicks “Start Lobby” → shares URL.
4. Each player selects traits + modifiers (UI stub OK).
5. Play 10 rounds. Auto‑log every state change to `/logs/<timestamp>.json`.
6. After Judgment Day, fill feedback table.

---

## 5. Coding Standards & Tooling

- TypeScript strict mode.
- Prettier + ESLint.
- Vite dev server.
- No external frameworks for MVP (Vanilla TS & SVG).

---

*Claude, execute these tasks sequentially; commit each module with descriptive messages. Begin with the CSV parser and card skin renderer so we can load decks in the browser UI ASAP.*

