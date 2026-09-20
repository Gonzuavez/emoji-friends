# Approved Bruno asset handoff — Work Order #002

No production art is committed. The monochrome Work Order #001 stand-in remains the fallback; it is not the approved character identity. Do not generate, download, or substitute replacement art.

## Required base image

Place the approved transparent PNG at **`public/characters/bruno/bruno.png`**. The configured URL is already `/characters/bruno/bruno.png`; adding the file and rebuilding is sufficient. Use an RGBA portrait canvas (2:3 recommended), centered character, head/cap toward the upper edge, and clear space around the paws. Alpha edges are preserved with `object-fit: contain`, no background, and no production-image mask. Test cropping on the real artwork before sign-off. An image still loading or failing to load keeps the existing stand-in visible.

Locked identity: warm brown fluffy teddy bear, oversized round head, tiny chibi body, enormous glossy amber-brown eyes, black ADYD cap, black ADYD hoodie, and backpack when appropriate. Nothing in this work order redesigns that identity.

## Approved performance / optional pose assets

The existing timeline now emits `capPeek → eyesRise → peek → paw → recognition → introduction → message → reaction → exit → wave → wink → turn → depart`, following the dark opening and soft knocks. `exit` carries the approved snacks line before the wave/wink/departure.

The base image can perform reveal, approach, gentle sway and recession through CSS. **A single static PNG cannot articulate a paw, wink, rotate to a true rear view, or walk with a backpack.** The old paw/eye stand-in animation is only a fallback. To realize those details without changing gift logic, supply approved transparent pose images and map them in `src/config/characters/bruno.ts` → `poseImages`. Suggested handoff filenames:

| Pose | Optional approved file |
| --- | --- |
| paw | `public/characters/bruno/bruno-paw.png` |
| reaction | `public/characters/bruno/bruno-reaction.png` |
| wave | `public/characters/bruno/bruno-wave.png` |
| wink | `public/characters/bruno/bruno-wink.png` |
| turn | `public/characters/bruno/bruno-turn.png` |
| depart | `public/characters/bruno/bruno-depart.png` (rear/backpack view) |

Use the same canvas and character anchor for every pose. Configure public URLs (without `public/`). Optional pose files are not requested until configured; failed pose images fall back to the base image, then the original stand-in. For fully articulated motion, provide the approved animation source, artboard/state-machine names and input mapping. A future Rive renderer belongs only in `BrunoCharacter.tsx`; **no Rive dependency or made-up Rive file is included**.

## Occasion prop

The gift configuration has `prop: null` by default. Bruno does not permanently carry a heart. An occasion may provide `{ image: '/characters/bruno/approved-prop.png', description: '...', showDuring: ['message', 'reaction'] }` after that prop is approved. The optional transparent overlay is hidden outside those poses and omitted on load failure. The heart in the final text reveal is part of the approved message, not a character prop.
