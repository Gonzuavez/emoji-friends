# Project Bruno — MVP Specification

## Objective
Create a delightful mobile-first "Thinking of You" character gift experience featuring Bruno the Bear.

## Experience sequence
1. **Arrival:** full viewport near-black screen; one clear tap-to-begin interaction so browser audio can be enabled.
2. **Suspense:** soft tap, pause, then two quicker taps with a subtle simulated glass response.
3. **Bruno appears:** a paw appears against the phone glass; Bruno peeks in and approaches.
4. **Recognition:** demo recipient is Leticia. "Psst... Leticia?" followed by "Hi! I'm Bruno. Angel asked me to bring you something."
5. **Personal message:** use a short hardcoded Thinking of You message, but keep recipient name, sender name and message configurable.
6. **Exit:** Bruno smiles/waves. Example: "Okay... my job here is done. But don't tell Angel I ate the snacks."
7. **Reveal:** "Someone thinking of you can change your whole day. ❤️" with primary CTA "Send Bruno to Someone" and subtle Emoji Friends branding.

## Design requirements
- Mobile-first portrait experience.
- Immersive, warm, premium, cinematic and uncluttered.
- Character remains the visual focus.
- Respect reduced-motion accessibility preferences.
- Audio must comply with browser autoplay restrictions.
- No login, payment, marketplace, dashboard or database in Phase 1.

## Engineering requirements
- Keep character configuration separate from experience sequencing.
- Make recipientName, senderName, message and character configurable.
- Avoid unnecessary dependencies.
- Organize assets by character.
- Do not add Supabase, Stripe, HeyGen or other paid APIs yet.
- Must be deployable on Netlify.
- Include clear local-development instructions.

## Definition of done
A user can open the deployed URL on a phone, tap once to begin, experience the complete Bruno sequence and reach the Send Bruno CTA without errors.
