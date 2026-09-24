const MODEL_ID = "fal-ai/kling-video/ai-avatar/v2/pro";
const QUEUE_BASE = `https://queue.fal.run/${MODEL_ID}`;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function requireSecret(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function falRequest(url, options = {}) {
  const falKey = requireSecret("FAL_KEY");
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Key ${falKey}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  return { response, payload };
}

export const handler = async (event) => {
  try {
    const gateToken = requireSecret("EMOJI_FAL_GATE_TOKEN");
    const suppliedToken =
      event.headers?.["x-emoji-fal-token"] ||
      event.headers?.["X-Emoji-Fal-Token"];

    if (!suppliedToken || suppliedToken !== gateToken) {
      return json(401, { error: "Unauthorized" });
    }

    if (event.httpMethod === "POST") {
      let input;
      try {
        input = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { error: "Request body must be valid JSON." });
      }

      const { image_url, audio_url, prompt = "." } = input;

      if (!isHttpUrl(image_url) || !isHttpUrl(audio_url)) {
        return json(400, {
          error: "image_url and audio_url must be valid http(s) URLs.",
        });
      }

      const { response, payload } = await falRequest(QUEUE_BASE, {
        method: "POST",
        body: JSON.stringify({ image_url, audio_url, prompt }),
      });

      return json(response.status, payload);
    }

    if (event.httpMethod === "GET") {
      const requestId = event.queryStringParameters?.requestId;
      const action = event.queryStringParameters?.action || "status";

      if (!requestId) {
        return json(400, { error: "requestId is required." });
      }

      if (!/^[A-Za-z0-9_-]+$/.test(requestId)) {
        return json(400, { error: "Invalid requestId." });
      }

      let url;
      if (action === "status") {
        url = `${QUEUE_BASE}/requests/${requestId}/status`;
      } else if (action === "result") {
        url = `${QUEUE_BASE}/requests/${requestId}`;
      } else {
        return json(400, { error: "action must be status or result." });
      }

      const { response, payload } = await falRequest(url, { method: "GET" });
      return json(response.status, payload);
    }

    return {
      statusCode: 405,
      headers: {
        allow: "GET, POST",
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ error: "Method not allowed." }),
    };
  } catch (error) {
    console.error("fal-avatar error", error);
    return json(500, { error: "Avatar generation service is unavailable." });
  }
};
