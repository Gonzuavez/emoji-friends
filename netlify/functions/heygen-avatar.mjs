const HEYGEN_BASE = "https://api.heygen.com";

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

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

async function heygenRequest(path, options = {}) {
  const apiKey = requireSecret("HEYGEN_API_KEY");
  const response = await fetch(`${HEYGEN_BASE}${path}`, {
    ...options,
    headers: {
      "X-Api-Key": apiKey,
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
    const gateToken = requireSecret("EMOJI_HEYGEN_GATE_TOKEN");
    const suppliedToken =
      event.headers?.["x-emoji-heygen-token"] ||
      event.headers?.["X-Emoji-Heygen-Token"];

    if (!suppliedToken || suppliedToken !== gateToken) {
      return json(401, { error: "Unauthorized" });
    }

    if (event.httpMethod === "GET") {
      const action = event.queryStringParameters?.action || "status";

      if (action === "me") {
        const { response, payload } = await heygenRequest("/v3/users/me", {
          method: "GET",
        });
        return json(response.status, payload);
      }

      if (action !== "status") {
        return json(400, { error: "action must be status or me." });
      }

      const videoId = event.queryStringParameters?.videoId;
      if (!videoId) {
        return json(400, { error: "videoId is required." });
      }

      if (!/^[A-Za-z0-9_-]+$/.test(videoId)) {
        return json(400, { error: "Invalid videoId." });
      }

      const { response, payload } = await heygenRequest(
        `/v3/videos/${videoId}`,
        { method: "GET" },
      );
      return json(response.status, payload);
    }

    if (event.httpMethod === "POST") {
      let input;
      try {
        input = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { error: "Request body must be valid JSON." });
      }

      const {
        image_url,
        audio_url,
        title = "Emoji Friends Bruno API Test",
        resolution = "1080p",
        aspect_ratio = "auto",
        background_color = "#000000",
      } = input;

      if (!isHttpUrl(image_url) || !isHttpUrl(audio_url)) {
        return json(400, {
          error: "image_url and audio_url must be valid http(s) URLs.",
        });
      }

      if (!["720p", "1080p", "4k"].includes(resolution)) {
        return json(400, {
          error: "resolution must be 720p, 1080p, or 4k.",
        });
      }

      if (!["auto", "16:9", "9:16", "4:5", "5:4", "1:1"].includes(aspect_ratio)) {
        return json(400, { error: "Unsupported aspect_ratio." });
      }

      if (!isHexColor(background_color)) {
        return json(400, {
          error: "background_color must be a 6-digit hex color such as #000000.",
        });
      }

      const body = {
        type: "image",
        image: {
          type: "url",
          url: image_url,
        },
        audio_url,
        title,
        resolution,
        aspect_ratio,
        background: {
          type: "color",
          value: background_color,
        },
      };

      const { response, payload } = await heygenRequest("/v3/videos", {
        method: "POST",
        body: JSON.stringify(body),
      });

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
    console.error("heygen-avatar error", error);
    return json(500, { error: "HeyGen avatar generation service is unavailable." });
  }
};
