# Approved Bruno asset handoff — Work Order #002

The supplied canonical `Brunoji.png` is installed byte-for-byte as `bruno.png` (1024×1536; SHA-256 `e8f7968f1e6ec7c4beea9b7e24e8dd26ebfefc86dd1526bd8a70fcb0e2973d37`). Its alpha channel and transparent edges are preserved. No additional approved individual pose files were supplied. The monochrome Work Order #001 stand-in remains the fallback; it is not the approved character identity. Do not generate, download, or substitute replacement art.

## Installed base image

The approved master is at **`public/characters/bruno/bruno.png`**. This is the supplied RGBA image; its existing alpha channel is rendered directly. The configured URL is already `/characters/bruno/bruno.png`; adding the file and rebuilding is sufficient. Use an RGBA portrait canvas (2:3 recommended), centered character, head/cap toward the upper edge, and clear space around the paws. Alpha edges are preserved with `object-fit: contain`, no background, and no production-image mask. Test cropping on the real artwork before sign-off. An image still loading or failing to load keeps the existing stand-in visible.

Locked identity: warm brown fluffy teddy bear, oversized round head, tiny chibi body, enormous glossy amber-brown eyes, cap and hoodie with the approved **Bruno paw-heart branding (not ADYD branding)**, and backpack when appropriate. Nothing in this work order redesigns that identity.

## Approved performance / optional pose assets

The existing timeline now emits `capPeek → eyesRise → peek → paw → recognition → introduction → message → reaction → exit → wave → wink → turn → depart`, following the dark opening and soft knocks. `exit` carries the approved snacks line before the wave/wink/departure.

Current mapping: `paw` explicitly maps to `/characters/bruno/bruno.png`; all other character poses resolve to that same base image. Cap/eyes/peek use CSS reveals, paw approaches with subtle glass highlights, speaking/reaction use a hold or gentle approach, wave uses a sway, wink holds the unchanged master, and turn/departure use perspective/recession/fade. The prototype paw graphic is hidden when production artwork is displayed; no drawn paw covers the supplied paws. **A single static PNG cannot articulate a paw, wink, rotate to a true rear view, or walk with a backpack.** The old paw/eye stand-in animation is only a fallback. To realize those details without changing gift logic, supply approved transparent pose images and map them in `src/config/characters/bruno.ts` → `poseImages`. Suggested handoff filenames:

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

The gift configuration has `prop: null` by default. Bruno does not permanently carry a heart. The locked paw-heart brand mark is part of his approved identity; it is separate from an occasion-specific emotional prop. An occasion may provide `{ image: '/characters/bruno/approved-prop.png', description: '...', showDuring: ['message', 'reaction'] }` after that prop is approved. The optional transparent overlay is hidden outside those poses and omitted on load failure. The heart in the final text reveal is part of the approved message, not a character prop.
