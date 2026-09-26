# HeyGen avatar backend

Emoji Friends has a protected Netlify Function for HeyGen v3 Image-to-Video generation.

## Environment variables

Configure these only in the server environment:

- `HEYGEN_API_KEY` — HeyGen API key from Settings > API
- `EMOJI_HEYGEN_GATE_TOKEN` — private gate token used to protect this internal endpoint

Never expose either value in browser JavaScript or commit them to Git.

## Verify the HeyGen connection

`GET /.netlify/functions/heygen-avatar?action=me`

Required header:

- `x-emoji-heygen-token: <private gate token>`

This proxies HeyGen `GET /v3/users/me` so the backend can confirm the key, account, and billing state without exposing the API key.

## Generate a Bruno talking video

`POST /.netlify/functions/heygen-avatar`

Required headers:

- `content-type: application/json`
- `x-emoji-heygen-token: <private gate token>`

Example body:

```json
{
  "image_url": "https://raw.githubusercontent.com/Gonzuavez/emoji-friends/main/public/characters/bruno/poses/bruno-talking.png",
  "audio_url": "https://raw.githubusercontent.com/Gonzuavez/emoji-friends/main/public/audio/bruno-message.mp3",
  "title": "Bruno HeyGen API Test",
  "resolution": "1080p",
  "aspect_ratio": "auto",
  "background_color": "#000000"
}
```

The function submits:

- `POST https://api.heygen.com/v3/videos`
- `type: "image"`
- image by public URL
- custom audio using `audio_url`
- solid pitch-black background

HeyGen returns a `video_id` in the response.

## Poll video status

`GET /.netlify/functions/heygen-avatar?action=status&videoId=<video_id>`

Use the same `x-emoji-heygen-token` header.

The backend proxies:

`GET https://api.heygen.com/v3/videos/<video_id>`

Expected HeyGen statuses include:

- `pending`
- `processing`
- `completed`
- `failed`

When complete, the response includes the generated `video_url`.

## Why this is server-side

HeyGen authenticates public API calls with the `X-Api-Key` header. The key must stay on the server.

A public recipient page must never be able to trigger paid generation directly. The intended product flow is:

creator/admin action
→ authenticated server route
→ protected HeyGen Netlify function
→ generated video
→ stored/referenced gift media
→ recipient playback

## Bruno test strategy

For the first comparison against fal.ai, use the existing canonical Bruno assets:

- appearance: `bruno-talking.png`
- audio: `bruno-message.mp3`
- background: `#000000`

Evaluate:

1. Bruno identity preservation
2. mouth synchronization
3. facial motion quality
4. silhouette/edge cleanliness
5. overall customer-ready quality
