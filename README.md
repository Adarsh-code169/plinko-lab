# Pond of Plinko

Welcome to **Pond of Plinko**, a high-fidelity, provably fair Plinko web application. 

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm / yarn / pnpm

### Environment Variables
Create a `.env` file in the root directory (Next.js automatically utilizes this for Prisma SQLite):
```env
DATABASE_URL="file:./dev.db"
```

### Setup & Run
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Initialize Database:**
   ```bash
   npx prisma db push
   ```
3. **Run Development Server:**
   ```bash
   npm run dev
   ```
Open https://plinko-lab-theta.vercel.app/

## 🏗️ Architecture Overview

The system runs on **Next.js 14 App Router**, leveraging serverless API routes for the backend and React Server Components for the frontend.

- **Frontend (`/components` & `/app`)**: An interactive HTML5 `<canvas>` handles the physics simulation of the Plinko board precisely interpreting drop results. 
- **Backend (`/app/api`)**: Manages the Provably Fair commit-reveal protocol. Generates server seeds, securely hashes them, and later validates the client seed to determine deterministic drops.
- **Database (`Prisma + SQLite`)**: Persists round states allowing verification sequences ensuring seeds are only revealed post-drop.

## ⚖️ Fairness Specification

`Pond of Plinko` utilizes an industry-standard **Commit-Reveal** cryptographic protocol:

1. **Hash/PRNG Details**: Before a round, the server generates a 32-byte hexadecimal `serverSeed` and a random `nonce`. It hashes these using **SHA-256** and gives the `commitHex` to the client. After the player selects the `dropColumn` and their own `clientSeed`, these are combined: `serverSeed + clientSeed + nonce`. This string is hashed and used to seed a **Mulberry32 PRNG**.
2. **Peg Map & Rounding**: A 12-row 2D array ("peg map") of fixed bias values (around 0.5) is generated using the PRNG. When descending the board, the ball compares the PRNG output to the left/right bias at that specific peg. 
3. **Validation**: Since the PRNG is completely deterministic based on the combined seed, anyone can locally hash the revealed `serverSeed` + `clientSeed` to perfectly reconstruct the path the ball took. A verification endpoint `/api/verify` provides this audit functionality.

## 🤖 AI Usage & Prompts

*This project was developed through pair-programming with Google Deepmind's Agentic AI.*
**Key Prompts Used:**
- *"change the ui of game...looks like human create and use pixel theme to create my webiste"* (Added custom CSS classes to replace Tailwind primitives with warm pixel-art wood textures).
- *"Use this ui [Behance Link] and make this kind of website for my game"* (Integrated high-fidelity 3D buttons, stone frames, drop shadows, and layout organization based on the reference design).
- *"change the background of website...use some pixel cartonis image...second is playuer is not geeting any lose...change the bottom so player have equal probability of wining or losing"* (Generated custom 2D pixel art environments for Levels 1-3, implemented Level-Up mechanics, and balanced the `.ts` Game Engine multipliers to introduce realistic house edge).

**What was kept/changed?**
- Used standard Next.js styling but overrode generic Tailwind colors to force the "Pond" color palette (warm wood, gold, cyan, jungle moss).
- Kept the hardcoded physics engine over standard physics libraries (like Matter.js) specifically so out-of-browser hashing audits could replicate the ball paths flawlessly.

## ⏱️ Time Log & Next Steps

**Approximate Completion Time:** 4-6 Hours 
*(Includes environment configuration, physics engine structuring, backend API setups, and heavy visual iteration).*

**Next Steps with More Time:**
1. Switch local SQLite to PostgreSQL (Supabase/Neon) for production scaling.
2. Store a rolling list of the last 20 global "High Payouts" in a live sidebar using WebSockets.
3. Enhance the physics canvas with Particle Emitters when balls hit high-multiplier bins.

## 🔗 Project Links

- **Live App**: https://plinko-lab-theta.vercel.app/

