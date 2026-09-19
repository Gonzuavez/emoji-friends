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

## Run Work Order #001

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
- `src/experiences/BrunoThinkingOfYou/`: explicit, centralized timeline and lifecycle hook. The roughly 30-second sequence progresses from opening through knocks, paw, peek, recognition, introduction, message, exit, departure, and CTA. Longer captions receive more reading time. Replay returns to the initial tap and cleans up prior playback. Pause/resume restarts the current beat; hiding the tab pauses until the user resumes.
- `src/components/stage/`: immersive glass/stage layer. CSS uses safe-area insets, responsive layouts, and reduced-motion overrides. Short/landscape screens scroll vertically so controls remain reachable.
- `src/components/character/BrunoCharacter.tsx`: replaceable, explicitly labeled monochrome Bruno stand-in. Pose names come from the timeline. No fetched artwork or character-animation dependency.
- `src/audio/ExperienceAudio.ts`: gesture-unlocked Web Audio, three soft synthesized knocks, optional local dialogue cues, cancellation, and silent fallback. Dialogue is always captioned. Sound and pause controls appear during playback.

## Bruno visual and audio handoff

**Next action for Angel/ChatGPT:** supply approved Bruno artwork (transparent PNG/WebP, ideally a portrait 2:3 canvas with head/paw clearance) or an approved animation containing paw press, peek/approach, recognition, smile/wave, and departure. Place a static asset at `public/characters/bruno/bruno.png` and set `character.image` to `/characters/bruno/bruno.png`. For a Rive handoff, place `bruno.riv` in the same folder and provide the artboard/state-machine/input names; player integration belongs to the next work order. See `public/characters/bruno/README.md`.

Supply four approved voice clips matching the configured text and names, then place them under `public/audio/` and set the `audio.recognition`, `audio.introduction`, `audio.message`, and `audio.exit` URLs in the gift config. Adjust the central beat durations to accommodate each recording. See `public/audio/README.md`.

## Current limitations and Work Order #002

This is the first recipient-experience proof of concept. Bruno is a temporary visual stand-in; there is no spoken dialogue until recordings are supplied. A configured static image uses approach/departure transitions but needs an animated asset for articulated expressions and waves. Optional recordings depend on browser audio support and network loading; captions continue if audio cannot play. Muting stops the current recording; unmuting applies to the next cue. Timings must be aligned with final voice clips. Test final sound and animation on physical iOS/Android devices before launch.

“Send Bruno to Someone” reveals a brief coming-next notice. It does not collect information or pretend to create/send a gift. Unknown gift IDs show a helpful fallback. Only the local demo gift exists.

For Work Order #002, approve the visual/voice handoff first, integrate those assets, and tune timing on real phones. Define the next sender/gift-link flow separately before implementing it. Accounts, database, payments, marketplace, analytics, paid TTS, and video APIs remain deferred.
