# Emoji Friends

Interactive digital character gifting platform by ADYD Ventures OÜ.

## Project Bruno — The Magic Moment

The first proof of concept is **Bruno: Thinking of You**.

The goal is to make a recipient feel that a character has come alive specifically for them:

1. Recipient opens a mobile gift link.
2. The screen fades to near-black.
3. Soft tapping/knocking begins.
4. Bruno appears at the phone "glass".
5. Bruno recognizes the recipient and delivers a short personalized message.
6. Bruno exits with a playful final beat.
7. The experience reveals a **Send Bruno** call to action.

## MVP principle

Build the magical recipient experience before accounts, payments, marketplace features, or complex infrastructure.

## Planned phases

- Phase 1: hardcoded Bruno mobile experience
- Phase 2: sender builder + unique gift links + Supabase
- Phase 3: payments + sharing + analytics
- Later: additional characters, occasions, creator marketplace, business characters, premium AI video

## Initial characters

- Bruno the Bear
- Pink Bunny
- Rex the Baby Dino
- Coquí the Frog
- Buddy the Puppy

## Technical direction

Mobile-first web experience. Netlify will host the application. Supabase, Stripe, TTS, and premium AI-video services remain deferred. Optional Rive application integration is implemented in Pass #001; the authored character rig is a separate creative deliverable.

© 2026 ADYD Ventures OÜ. All rights reserved.

## Run the Bruno experience (Work Orders #001–002)

Use Node.js 22.12+ (Node 22 recommended) and npm.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Open `/` or `/g/bruno-thinking-of-you`. Vite prints the local and LAN URLs; use the LAN URL on a phone on the same network. The preview command serves the production build. `netlify.toml` builds `dist` and rewrites direct gift links to the app. No environment variables or services are needed.

```sh
npx playwright install chromium
npm test
```

Tests run against the production build, so run `npm run build` first. They cover the complete timeline, exact demo dialogue, replay, the send CTA, pause/resume, missing Web Audio, unknown gifts, horizontal overflow, and iPhone/Android portrait, desktop, and reduced-motion modes. Screenshots and failure traces go to ignored `test-results/`. Timeline/control tests use a controlled browser clock. Shipped-asset tests also run the complete performance in real time with the actual MP3 decoder and production image.

## Architecture

- `src/config/gifts/brunoThinkingOfYou.ts`: typed gift data, all personalized copy, and async `loadGift(id)` boundary. Edit `senderName`, `recipientName`, and `message` here. The same `/g/:giftId` route and experience render every gift; the local loader can later be replaced with a data service.
- `src/experiences/BrunoThinkingOfYou/`: explicit, centralized timeline and lifecycle hook. The caption-only sequence runs for roughly 35 seconds: dark opening/knocks, cap peek, eyes rise, full peek, paw press, recognition/introduction/message, warm reaction, exit line, wave, wink, turn, departure, and CTA. Real clips extend beats when needed. Longer captions receive more reading time. Replay returns to the initial tap and cleans up prior playback. Pause/resume restarts the current beat; hiding the tab pauses until the user resumes.
- `src/components/stage/`: immersive glass/stage layer. CSS uses safe-area insets, responsive layouts, and reduced-motion overrides. Short/landscape screens scroll vertically so controls remain reachable.
- `src/components/character/BrunoCharacter.tsx`: optional Rive/PNG orchestration, with the stable PNG implementation in `BrunoPngCharacter.tsx` and original explicitly labeled stand-in on missing/failed artwork. Pose names come from the existing timeline. An optional gift-level prop is shown only during configured poses, never permanently attached to Bruno.
- `src/config/characters/bruno.ts`: approved image path, optional pose mappings, locked canonical HeyGen voice **BRUNOJI** (`M9QQyAAoUtDSmALeZnRw`), English voice direction, and the four local demo clip URLs.
- `src/audio/ExperienceAudio.ts`: gesture-unlocked Web Audio, three soft synthesized knocks, bounded preload/decode, actual clip-completion timing, cancellation, and silent fallback. Dialogue is always captioned. Sound and pause controls appear during playback.

## Supplied production assets

The approved `Brunoji.png` master and all four files from `Bruno_BRUNOJI_Audio_Pack.zip` are installed unchanged at these configured paths:

- `public/characters/bruno/bruno.png`
- `public/audio/bruno-recognition.mp3`
- `public/audio/bruno-introduction.mp3`
- `public/audio/bruno-message.mp3`
- `public/audio/bruno-exit.mp3`

The production identity is locked to the approved Bruno bear with **Bruno paw-heart branding**, not ADYD character branding. ADYD Ventures remains the platform owner/copyright holder. The canonical voice is **BRUNOJI** on HeyGen, Voice ID `M9QQyAAoUtDSmALeZnRw`; the client only plays exported local clips.

Merged main supplies the approved standalone pose pack in `public/characters/bruno/poses/`. Cap/peek, rising, paw/glass, hello, master, talking, wave, wink and exit PNGs map to their established performance beats; the stable CSS treatment and preload/failure behavior remain intact. The base master is retained outside configured performance poses. No artwork is generated or changed by the Rive pass.

See [visual handoff](public/characters/bruno/README.md) for the locked identity, transparent-canvas requirements, optional pose files for the approved wave/wink/backpack departure, and occasion prop configuration. See [voice handoff](public/audio/README.md) for the exact four scripts and canonical voice direction. No replacement artwork or voice has been invented. `prop: null` is the default; a heart is not part of Bruno’s permanent character design.

## Voice timing and controls

Clips preload after the initial gesture and are decoded through Web Audio. Dialogue beats wait for the longer of caption-reading time and actual clip completion (plus 250 ms). Failed or slow fetch/decode falls back to captions after a bounded 2.5-second loading budget. The existing sequence/timing module remains the source of visual pacing. Long recordings naturally lengthen the experience.

Pause stops speech and the current beat; Resume re-unlocks audio from the gesture and starts that beat again. Mute silences the master output without losing clip position. Replay cancels active speech, invalidates delayed work, aborts pending requests, and clears the cache. Hiding the tab pauses the experience. A stalled playback watchdog and audio-interruption handling prevent indefinite waits. Captions always remain visible for the complete spoken beat.

## Validation and physical-phone handoff

Run `npm ci`, `npm run build`, then `npm test`. The browser suite covers the original experience plus configured production asset/fallback, canonical clip paths, long-clip caption timing, mute/pause/resume, replay cleanup, missing/invalid/slow audio, approved pose order, reduced motion, and 320px portrait layout. Synthetic audio doubles and a neutral test pixel only exist inside tests; they are not production artwork or voice.

**Physical iPhone/Android validation is pending.** On iPhone Safari and Android Chrome, check the initial tap, silent-mode/volume behavior, headphones/Bluetooth, pause/resume, mute/unmute mid-sentence, replay twice, tab switching, screen lock, slow networking, safe areas, portrait/landscape, and reduced motion. Confirm eye contact, caption pacing, voice level, and the final emotional result with the approved art/audio. Browser emulation does not validate those qualities.

## Netlify preview handoff

The existing `netlify.toml` is unchanged: Node 22, `npm run build`, publish `dist`, SPA rewrite for `/g/:giftId`. No environment variables are needed. The dedicated `emoji-friends` Netlify project belongs to the A.N.G.E.L.S team and is connected only to `Gonzuavez/emoji-friends`. Pull requests build as Deploy Previews; PR #4 has merged into main. The Rive pass uses a separate draft PR.

Use the successful Deploy Preview link attached to the current draft PR or open the [Emoji Friends deploy dashboard](https://app.netlify.com/projects/emoji-friends/deploys). The existing A.N.G.E.L.S website/project is separate and unchanged. Keep the checked-in build settings; do not merge the PR to test it. Open `/g/bruno-thinking-of-you` on the resulting HTTPS preview URL. The preview uses the supplied real master and BRUNOJI recordings; missing or failed assets still fall back gracefully. Do not promote to production until reviewed.

## Current limitations

The supplied 1024×1536 RGBA master and its transparent edges are preserved unchanged. The approved standalone PNG poses remain static artwork with CSS motion. They do not supply a genuinely articulated body/face rig. The optional Rive runtime, state mapping and mouth signal are ready; a professionally authored `public/rive/bruno/bruno.riv` is required for true continuous articulated performance. Reduced motion presents the same ordered poses without animated movement.

“Send Bruno to Someone” retains the coming-next notice; it does not create or send a gift. Only the local demo exists. Supabase, payments, authentication, sender builder, marketplace, analytics, paid TTS/video APIs, admin tools, and other characters remain out of scope.

## Bruno Rive Integration Pass #001

This pass is based on merged `main` and preserves its approved standalone PNG
pose renderer in `BrunoPngCharacter.tsx`. `BrunoCharacter` now orchestrates a
validated optional Rive renderer and that immediately available fallback.
The official `@rive-app/react-canvas` runtime is lazy-loaded; no binary is
statically imported and the production app works when `bruno.riv` is absent.

The exact creative deliverable and input contract are documented in
[the Rive authoring handoff](public/rive/bruno/README.md). Required location:
`public/rive/bruno/bruno.riv`; artboard `Bruno`; machine `BrunoStateMachine`.
No real authored Rive file is included, so true articulated Rive animation has
not been visually verified. Approved PNGs remain the production renderer.
The supplied HeyGen MP4 is a motion reference only, not shipped application media.

Timeline mapping and entry guards live in `src/lib/rive/brunoStateMap.ts`.
The mouth driver in `src/lib/audio/mouthEnvelope.ts` reads the existing BRUNOJI
speech graph before mute gain, with normalization and attack/release smoothing.
This implements amplitude-driven movement, not phoneme-perfect lip sync.
Rive receives normalized samples via a subscription without per-frame React
rerenders, new AudioContexts or duplicate speech sources. The website continues
to own the black opening. Rive alone receives a 3-second departure beat; existing
PNG timing and all approved MP3/PNG bytes are preserved.

Validation uses `npm ci`, `npm run build`, `npm test`, `git diff --check`.
Playwright tests the production build and a separate development-only runtime
harness (never included in `dist`) to verify missing/invalid contract fallback,
ready/late/error handoffs, one-shot triggers, mouth behavior and reduced motion.
The new draft PR gets its own Deploy Preview in the existing Emoji Friends
Netlify project. This pass must not be automatically merged.
