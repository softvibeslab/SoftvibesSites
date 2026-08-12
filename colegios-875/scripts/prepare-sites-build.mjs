import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/.openai", { recursive: true });

copyFileSync(".openai/hosting.json", "dist/.openai/hosting.json");

const textRoutes = {
  "/": {
    body: readFileSync("index.html", "utf8"),
    type: "text/html; charset=utf-8"
  },
  "/index.html": {
    body: readFileSync("index.html", "utf8"),
    type: "text/html; charset=utf-8"
  }
};

const assetRoutes = {
  "/img/edificio.glb": "model/gltf-binary",
  "/img/hero-edificio.jpg": "image/jpeg",
  "/img/logo-aura.jpg": "image/jpeg",
  "/img/naturaleza.jpg": "image/jpeg",
  "/img/plan-deptos.jpg": "image/jpeg",
  "/img/plan-garden.jpg": "image/jpeg",
  "/img/render-armonia.jpg": "image/jpeg",
  "/img/render-integrales.jpg": "image/jpeg"
};

const binaryRoutes = Object.fromEntries(
  Object.entries(assetRoutes).map(([route, type]) => [
    route,
    {
      body: readFileSync(route.slice(1)).toString("base64"),
      type
    }
  ])
);

writeFileSync(
  "dist/server/index.js",
  `const textRoutes = ${JSON.stringify(textRoutes)};
const binaryRoutes = ${JSON.stringify(binaryRoutes)};
const encoder = new TextEncoder();

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function base64UrlFromBytes(bytes) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 1) text += String.fromCharCode(bytes[i]);
  return btoa(text).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
}

function base64UrlFromJson(value) {
  return base64UrlFromBytes(encoder.encode(JSON.stringify(value)));
}

async function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 60)
  };
  const unsigned = base64UrlFromJson(header) + "." + base64UrlFromJson(body);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(unsigned));
  return unsigned + "." + base64UrlFromBytes(new Uint8Array(signature));
}

async function vapiTokenResponse(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const privateKey = env.VAPI_PRIVATE_KEY || env.VAPI_API_KEY;
  const orgId = env.VAPI_ORG_ID;
  const assistantId = env.VAPI_ASSISTANT_ID || "944b05bf-4dd4-4e07-b979-40e4bfccc9bb";

  if (!privateKey || !orgId || !assistantId) {
    return jsonResponse({ error: "Vapi runtime is not configured" }, 500);
  }

  const requestOrigin = new URL(request.url).origin;
  const allowedOrigins = Array.from(new Set([
    requestOrigin,
    env.VAPI_ALLOWED_ORIGIN
  ].filter(Boolean)));

  const token = await signJwt({
    orgId,
    token: {
      tag: "public",
      restrictions: {
        enabled: true,
        allowedOrigins,
        allowedAssistantIds: [assistantId],
        allowTransientAssistant: false
      }
    }
  }, privateKey);

  return jsonResponse({
    token,
    assistantId,
    expiresInSeconds: 1800
  });
}

function bytesFromBase64(value) {
  const text = atob(value);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i);
  return bytes;
}

function responseFor(route, method) {
  const text = textRoutes[route];
  if (text) {
    return new Response(method === "HEAD" ? null : text.body, {
      headers: {
        "content-type": text.type,
        "cache-control": "public, max-age=60"
      }
    });
  }

  const binary = binaryRoutes[route];
  if (binary) {
    return new Response(method === "HEAD" ? null : bytesFromBase64(binary.body), {
      headers: {
        "content-type": binary.type,
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = url.pathname === "" ? "/" : url.pathname;

    if (route === "/api/vapi-token") {
      return vapiTokenResponse(request, env);
    }

    const response = responseFor(route, request.method);
    if (response) return response;

    if ((request.method === "GET" || request.method === "HEAD") && !route.includes(".")) {
      return responseFor("/", request.method);
    }

    return new Response("Not found", { status: 404 });
  }
};
`
);
