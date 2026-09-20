# Canonical Bruno voice handoff — Work Order #002

The four supplied recordings from `Bruno_BRUNOJI_Audio_Pack.zip` are installed unchanged at the paths below. File hashes are checked by the shipped-asset tests. No regeneration, pitch shifting, transcoding, or substitution was performed. Captions remain usable if audio is unavailable. URLs are configured in `src/config/characters/bruno.ts`.

| File | Exact spoken text |
| --- | --- |
| `public/audio/bruno-recognition.mp3` | Psst… Leticia? |
| `public/audio/bruno-introduction.mp3` | Hi! I’m Bruno. Angel asked me to bring you something. |
| `public/audio/bruno-message.mp3` | Just a little reminder that someone is thinking about you today. |
| `public/audio/bruno-exit.mp3` | Okay… my job here is done. But don’t tell Angel I ate the snacks. |

Detected MP3 durations (macOS `afinfo`): recognition **1.464 s**, introduction **3.456 s**, message **3.120 s**, exit **4.416 s**. Native browser decoded durations may be slightly shorter because encoder padding is removed; playback completion remains authoritative.

Use the locked canonical HeyGen voice **BRUNOJI**, Voice ID **`M9QQyAAoUtDSmALeZnRw`**, English: youthful/childlike (roughly 8–10-year-old character feel), light, warm, cheerful, curious, playful, gentle, expressive, natural, family-friendly. Never squeaky/shrill, deep/adult, announcer-like, or corporate. This identity and direction live separately from gift text and clip URLs, ready for future occasions. Export the four approved scripts using BRUNOJI and place the MP3 files at the paths above; do not independently choose a new voice for each gift.

The voice name/provider/ID are public identity metadata, not an API key and not permission to call HeyGen from this app. Future reuse should match `(provider, voice ID, language, exact script)`; changing a recipient, sender, or message requires a matching clip or caption-only fallback. These demo files must not be reused for different names/text. No voice generation, provider SDK, API keys, or paid TTS calls run in the client. Any future generation workflow needs a separate work order.

The initial tap resumes Web Audio directly, then preloads/decodes local files during suspense. The timeline waits for both the minimum caption-reading duration and actual audio completion plus a 250 ms breathing beat. No manual duration edits are needed for normal clips. Fetch/decode has a 2.5-second budget; missing, invalid, or slow clips silently fall back. A decoded-duration watchdog prevents stalled playback from freezing a beat. Pause stops the clip; Resume retries audio unlocking from a valid gesture and restarts the current beat. Mute changes the output gain while speech timing continues; unmute rejoins the same clip. Replay cancels playback and pending loads and clears the clip cache for a clean new run.

Deliver ordinary browser-decodable MP3 files, without excessive leading/trailing silence. Validate sound level, voice approval, decoded durations, interruptions, and timing on real iPhone Safari and Android Chrome. Test over HTTPS and a slow connection. Emulated browser tests cannot certify physical-phone audio behavior or emotional quality.
