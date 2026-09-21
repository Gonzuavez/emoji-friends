# Bruno Rive authoring contract — Pass #001

**Engineering integration is provided; no authored `bruno.riv` is included.**
The application works without it and retains the approved PNG performance.
A mock runtime in tests does not constitute a completed or visually verified rig.

## Deliverable

- File: `public/rive/bruno/bruno.riv`
- Public URL: `/rive/bruno/bruno.riv`
- Artboard: **Bruno**
- State machine: **BrunoStateMachine**
- Transparent background; contain-fit, bottom-center alignment.
- Embed all necessary artwork in the file; no external audio, scripts, links, or
  interaction events. The website exclusively owns playback and controls.

Required state-machine inputs (exact, case-sensitive):

| Input | Type | Meaning |
| --- | --- | --- |
| showBruno | boolean | False resets to Hidden, including replay |
| talking | boolean | Speech phase active and experience not paused |
| mouthOpen | number | 0..1, rest through fully open |
| peekTrigger | trigger | Cap/eyes peek entry |
| riseTrigger | trigger | Rise entry |
| pawTrigger | trigger | Forward paw press |
| winkTrigger | trigger | Warm reaction or goodbye wink |
| waveTrigger | trigger | Arm wave |
| turnTrigger | trigger | Rotate toward rear/backpack view |
| departTrigger | trigger | Extended walking departure |

`mood: number` is optional for the future and is not validated/required now.
The installed official runtime still supports these legacy state-machine inputs;
this pass deliberately implements the requested contract rather than migrating
it to data binding. A future runtime major upgrade must recheck this interface.

## Reference authority

**Appearance / proportions / key poses:** the approved standalone PNGs in
`public/characters/bruno/poses/`: `bruno-master.png`, `bruno-peek.png`,
`bruno-rising.png`, `bruno-paw-glass.png`, `bruno-hello.png`,
`bruno-talking.png`, `bruno-wave.png`, `bruno-wink.png`, `bruno-exit.png`.
Preserve the warm brown plush fur, enormous amber/brown eyes, black cap/hoodie,
Bruno paw-heart emblem/signature and backpack. No ADYD character branding,
new character design, replacement artwork, sprite sheet or cropped-PNG rig.

**Motion only:** `Cute_Character_Pose_Transitions.mp4` supplied separately.
Its appearance/background are not authoritative. It is not shipped as the
renderer, nor extracted into an application sprite sequence. Choreography in
this contract takes precedence. The reference ending is too short.

**Environment:** the website owns the pitch-black opening, knocks, glass/ripple
response, ambient glow, captions, safe areas, controls and CTA. Never bake the
video's environment or a black rectangle into the Rive artwork.

## Rig and motion

Face/head: head, left/right ears, cap, eyes, eyelids, eyebrows and muzzle.
Mouth: rest, small, medium and large open shapes, smoothly blended by mouthOpen.
Future optional O/wide and other viseme shapes should remain extensible.

Body: torso, pelvis/lower body, left/right upper arm, forearm and paw, left/right
leg, backpack; optional hoodie strings/secondary clothing. Preserve the approved
silhouette and proportions, with articulated parts rather than whole-image warps.

Conceptual states: Hidden, Peek, Rise, PawPress, Idle, Talking, Wink, Wave, Turn,
Depart. Flow: Hidden → Peek → Rise → Idle; Idle → PawPress → Idle;
Idle ↔ Talking; Idle → Wink/Wave → Idle; Idle → Turn → Depart.

Idle: subtle breathing, tiny head movement and occasional blinking. Talking:
subtle body/head movement and natural blinking with the externally driven mouth.
Paw press: torso approaches, shoulders/arms/paws articulate toward phone glass
with natural body compensation. Wave: shoulder/arm/forearm articulation. Wink:
eyelid articulation and slight expressive head motion. Turn: torso rotates,
head follows, rear/backpack becomes clearly visible.

### Extended departure (3 seconds)

Turn → backpack visible → walking cycle with several believable steps →
progressive depth travel and substantial shrinkage → optional slight rightward
travel → fade only near the end → fully disappear → CTA.

Author departure to complete within the 3-second Rive timeline beat (target
2.5–3.5 seconds). Bruno must finish much farther away than the MP4's final frame.
Do not cut at the reference endpoint. Use a smoothly entered repeating walk
cycle, with authored travel/scale, and complete disappearance before CTA.
The website grants 3 seconds only when Rive is active; PNG timing is unchanged.

## Timeline contract

| Phase | showBruno | talking | Entry action |
| --- | --- | --- | --- |
| idle, opening, knock1, knock2, knock3 | false | false | reset Hidden |
| capPeek | true | false | peekTrigger |
| eyesRise | true | false | riseTrigger |
| peek | true | false | hold |
| paw | true | false | pawTrigger |
| recognition, introduction, message | true | true | speech |
| reaction | true | false | winkTrigger |
| exit | true | true | speech |
| wave | true | false | waveTrigger |
| wink | true | false | winkTrigger |
| turn | true | false | turnTrigger |
| depart | true | false | departTrigger |
| cta | false | false | reset Hidden |

Triggers fire exactly once per phase entrance, including on replay, not on React
rerenders, mouth samples, mute or resume. A paused runtime pauses its state machine;
talking becomes false and mouth closes. Resume continues the runtime while the
existing audio system restarts its current clip/beat. Hidden must reset the rig
so replay begins correctly without reconstructing the runtime.

## Mouth and canonical audio

BRUNOJI / HeyGen voice ID `M9QQyAAoUtDSmALeZnRw`; existing recognition,
introduction, message and exit MP3 bytes are unchanged. No HeyGen API/TTS/video
calls. An AnalyserNode in the existing AudioContext observes the existing speech
source before output gain, so muting does not stop speech articulation. Knocks
bypass analysis. RMS uses a 0.012 noise floor, normalization scale 0.24, 45ms
attack and 130ms release. Silence decays to exact zero; pause/replay/interruption
close immediately. One animation-frame loop runs only for speech/release with
an active subscriber. All values are clamped 0..1.

This is amplitude-driven mouth movement, **not phoneme-perfect lip sync**.
The MouthSignal subscription boundary can later receive timed phoneme/viseme
values instead. Future shapes: REST, A/E/I, O/U, M/B/P, F/V. No viseme generator
is part of this pass.

## Loading, fallback and handoff

PNG preloads immediately and retains the stable main renderer unchanged.
Rive loads at runtime, with an 8-second total readiness budget. HTTP failure,
HTML SPA fallback, invalid binary, wrong artboard/state machine, missing/wrong
inputs, failed WASM, timeout or runtime error keeps/restores PNG. No fake binary
is created. Only an actual loaded contract plus a runtime advance reports ready.
The Rive engine is lazy-loaded only after the file header is validated.

The handoff happens during idle/black opening/knocks with a 250ms visibility
transition; a late-ready rig waits until replay. PNG stays mounted/preloaded but
hidden while Rive is primary; only one character is visible. Audio/captions never
wait on Rive. Reduced motion deliberately uses approved static PNG poses.
Occasion props use PNG until a separately approved Rive prop contract exists;
no permanent heart or speculative body parts are introduced.

## Acceptance after asset delivery

Place the genuinely authored asset at the exact path above, build, and verify its
actual appearance, all inputs, pause/replay and sustained running on physical
phones. Inspect transparent edges, eye contact, mouth levels, paw/glass approach,
articulated wave/wink, backpack turn and full 3-second distant departure. Current
mock-runtime tests validate application behavior only, not this creative asset.
