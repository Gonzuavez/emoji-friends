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

Mobile-first web experience. Netlify will host the application. Supabase, Stripe, TTS, Rive, and premium AI-video integrations are intentionally deferred until the core experience is proven.

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

Tests run against the production build, so run `npm run build` first. They cover the complete timeline, exact demo dialogue, replay, the send CTA, pause/resume, missing Web Audio, unknown gifts, horizontal overflow, and phone/desktop/reduced-motion modes. Screenshots and failure traces go to ignored `test-results/`. Browser tests advance the browser clock instead of waiting through each performance.

## Architecture

- `src/config/gifts/brunoThinkingOfYou.ts`: typed gift data, all personalized copy, and async `loadGift(id)` boundary. Edit `senderName`, `recipientName`, and `message` here. The same `/g/:giftId` route and experience render every gift; the local loader can later be replaced with a data service.
- `src/experiences/BrunoThinkingOfYou/`: explicit, centralized timeline and lifecycle hook. The caption-only sequence runs for roughly 35 seconds: dark opening/knocks, cap peek, eyes rise, full peek, paw press, recognition/introduction/message, warm reaction, exit line, wave, wink, turn, departure, and CTA. Real clips extend beats when needed. Longer captions receive more reading time. Replay returns to the initial tap and cleans up prior playback. Pause/resume restarts the current beat; hiding the tab pauses until the user resumes.
- `src/components/stage/`: immersive glass/stage layer. CSS uses safe-area insets, responsive layouts, and reduced-motion overrides. Short/landscape screens scroll vertically so controls remain reachable.
- `src/components/character/BrunoCharacter.tsx`: production PNG/optional pose adapter with the original, explicitly labeled stand-in on missing/failed assets. Pose names come from the existing timeline; future Rive integration stays in this layer. An optional gift-level prop is shown only during configured poses, never permanently attached to Bruno.
- `src/config/characters/bruno.ts`: approved image path, optional pose mappings, locked canonical HeyGen voice **BRUNOJI** (`M9QQyAAoUtDSmALeZnRw`), English voice direction, and the four local demo clip URLs.
- `src/audio/ExperienceAudio.ts`: gesture-unlocked Web Audio, three soft synthesized knocks, bounded preload/decode, actual clip-completion timing, cancellation, and silent fallback. Dialogue is always captioned. Sound and pause controls appear during playback.

## Production files still needed

No approved production image or voice file is physically present. Add these exact files and rebuild; their URLs are already configured:

- `public/characters/bruno/bruno.png`
- `public/audio/bruno-recognition.mp3`
- `public/audio/bruno-introduction.mp3`
- `public/audio/bruno-message.mp3`
- `public/audio/bruno-exit.mp3`

The production identity is locked to the approved Bruno bear with **Bruno paw-heart branding**, not ADYD character branding. ADYD Ventures remains the platform owner/copyright holder. The canonical voice is **BRUNOJI** on HeyGen, Voice ID `M9QQyAAoUtDSmALeZnRw`; the client only plays exported local clips.

See [visual handoff](public/characters/bruno/README.md) for the locked identity, transparent-canvas requirements, optional pose files for the approved wave/wink/backpack departure, and occasion prop configuration. See [voice handoff](public/audio/README.md) for the exact four scripts and canonical voice direction. No replacement artwork or voice has been invented. `prop: null` is the default; a heart is not part of Bruno’s permanent character design.

## Voice timing and controls

Clips preload after the initial gesture and are decoded through Web Audio. Dialogue beats wait for the longer of caption-reading time and actual clip completion (plus 250 ms). Failed or slow fetch/decode falls back to captions after a bounded 2.5-second loading budget. The existing sequence/timing module remains the source of visual pacing. Long recordings naturally lengthen the experience.

Pause stops speech and the current beat; Resume re-unlocks audio from the gesture and starts that beat again. Mute silences the master output without losing clip position. Replay cancels active speech, invalidates delayed work, aborts pending requests, and clears the cache. Hiding the tab pauses the experience. A stalled playback watchdog and audio-interruption handling prevent indefinite waits. Captions always remain visible for the complete spoken beat.

## Validation and physical-phone handoff

Run `npm ci`, `npm run build`, then `npm test`. The browser suite covers the original experience plus configured production asset/fallback, canonical clip paths, long-clip caption timing, mute/pause/resume, replay cleanup, missing/invalid/slow audio, approved pose order, reduced motion, and 320px portrait layout. Synthetic audio doubles and a neutral test pixel only exist inside tests; they are not production artwork or voice.

**Physical iPhone/Android validation is pending.** On iPhone Safari and Android Chrome, check the initial tap, silent-mode/volume behavior, headphones/Bluetooth, pause/resume, mute/unmute mid-sentence, replay twice, tab switching, screen lock, slow networking, safe areas, portrait/landscape, and reduced motion. Confirm eye contact, caption pacing, voice level, and the final emotional result with the approved art/audio. Browser emulation does not validate those qualities.

## Netlify preview handoff

The existing `netlify.toml` is unchanged: Node 22, `npm run build`, publish `dist`, SPA rewrite for `/g/:giftId`. No environment variables are needed. This work order prepares the code and PR; it does not deploy or merge them.

If this repository already has a Netlify site with Deploy Previews enabled, use the deploy-preview link attached to the new PR after its build succeeds. Otherwise connect the GitHub repository to Netlify, retain the checked-in build settings, enable Deploy Previews, and build this PR head. Open `/g/bruno-thinking-of-you` on the resulting HTTPS preview URL. Add approved files before the emotional test; without them the preview intentionally uses the original stand-in and captions. Do not promote to production until reviewed.

## Current limitations

A static front-view PNG supports CSS reveals/approach/sway/departure, but cannot produce an articulated production paw, wink, or turn-and-walk animation with a backpack. Those pose hooks are ready; approved pose art or a later approved animation is still required for the full visual performance. Reduced motion presents the same ordered poses without animated movement.

“Send Bruno to Someone” retains the coming-next notice; it does not create or send a gift. Only the local demo exists. Supabase, payments, authentication, sender builder, marketplace, analytics, paid TTS/video APIs, admin tools, and other characters remain out of scope.
