# Bruno asset handoff

No final artwork is included. `BrunoCharacter.tsx` is a temporary monochrome stand-in, not an approved character design.

Place an approved transparent PNG/WebP at `public/characters/bruno/bruno.png` and set `character.image` to `/characters/bruno/bruno.png` in the gift configuration. A transparent 2:3 portrait canvas, centered character, and generous paw/head clearance work best. Missing images fall back to the stand-in.

For a future animated asset, place `bruno.riv` here and replace the rendering layer in `src/components/character/BrunoCharacter.tsx` with its player after approval. No Rive dependency is installed. Map timeline poses `paw`, `peek`, `recognition`, `introduction`, `message`, `exit`, `depart` to the approved animation's states. A static image can approach and depart but cannot provide an articulated wave; the approved animation must supply that.
