# fal.ai avatar backend

Emoji Friends now has a server-side fal.ai integration for Kling AI Avatar v2 Pro.

## Endpoint

`POST /api/fal/avatar`

Required headers:

- `content-type: application/json`
- `x-emoji-fal-token: <server-side gate token>`

Body:

```json
{
  "image_url": "https://example.com/bruno.png",
  "audio_url": "https://example.com/message.mp3",
  "prompt": "."
}
```

The request is submitted to `fal-ai/kling-video/ai-avatar/v2/pro` through fal's queue API.

The response includes a fal `request_id`.

## Poll status

`GET /api/fal/avatar?action=status&requestId=<id>`

Use the same `x-emoji-fal-token` header.

## Fetch result

`GET /api/fal/avatar?action=result&requestId=<id>`

When complete, fal returns the generated video URL.

## Security

`FAL_KEY` never appears in client code. The Netlify function reads it from the server environment.

The endpoint also requires `EMOJI_FAL_GATE_TOKEN`. Do not put that token in public browser JavaScript. The intended next step is to call this endpoint from an authenticated creator/admin workflow or another server-side function.

This design prevents a public visitor from triggering paid fal.ai inference directly.
