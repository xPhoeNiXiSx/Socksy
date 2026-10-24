/**
 * Photos des envies : celle de la page produit, ou celle qu'on envoie.
 *
 * La page produit annonce presque toujours sa photo dans ses balises de
 * partage (`og:image`, `twitter:image`) : c'est ce qu'on lit, sans chercher
 * à comprendre le reste de la page.
 */

const META_KEYS = ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"];

/** Décode les quelques entités qu'on croise dans une adresse d'attribut. */
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  return match ? (match[1] ?? match[2] ?? null) : null;
}

/** N'accepte qu'une adresse http(s), rendue absolue par rapport à la page. */
function absoluteHttpUrl(value: string, base: string): string | null {
  try {
    const url = new URL(decodeEntities(value.trim()), base);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** La photo annoncée par une page HTML, ou `null`. */
export function extractImage(html: string, pageUrl: string): string | null {
  const found = new Map<string, string>();

  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = (attribute(tag, "property") ?? attribute(tag, "name"))?.toLowerCase();
    const content = attribute(tag, "content");
    if (key && content && META_KEYS.includes(key) && !found.has(key)) {
      found.set(key, content);
    }
  }

  for (const key of META_KEYS) {
    const value = found.get(key);
    const url = value ? absoluteHttpUrl(value, pageUrl) : null;
    if (url) return url;
  }

  // Dernier recours, plus ancien que les balises de partage.
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const href = attribute(tag, "href");
    if (attribute(tag, "rel")?.toLowerCase() === "image_src" && href) {
      return absoluteHttpUrl(href, pageUrl);
    }
  }

  return null;
}

/** Au-delà, la page est tronquée : les balises de partage sont dans l'en-tête. */
const MAX_HTML_BYTES = 1_000_000;

/**
 * Va chercher la page du lien et en extrait la photo. Ne lève jamais : une
 * boutique qui refuse ou qui traîne donne simplement une envie sans photo.
 */
export async function fetchLinkImage(link: string): Promise<string | null> {
  try {
    const response = await fetch(link, {
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: {
        // Beaucoup de boutiques refusent les robots déclarés.
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "fr-FR,fr;q=0.9",
      },
    });
    if (!response.ok || !response.body) return null;
    if (!(response.headers.get("content-type") ?? "").includes("html")) return null;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let size = 0;
    while (size < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      html += decoder.decode(value, { stream: true });
      // L'en-tête suffit : inutile de lire le reste de la page.
      if (html.includes("</head>")) break;
    }
    await reader.cancel().catch(() => {});

    return extractImage(html, response.url || link);
  } catch {
    return null;
  }
}

/** `true` si l'envoi de photos est possible (stockage Vercel Blob relié). */
export function isUploadConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Les photos envoyées vivent sur ce domaine : elles seules sont à supprimer. */
export function isStoredImage(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}
