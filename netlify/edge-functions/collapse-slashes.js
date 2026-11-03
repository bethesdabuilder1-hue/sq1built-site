// 301 a repeated slash (//about, ///about) down to a single slash.
// Netlify's redirect engine normalizes those paths before _redirects runs,
// so a redirect rule cannot tell //about from /about and would loop.
// Host and query string are preserved (deploy previews, ?location=frederick).

export function collapseSlashTarget(requestUrl) {
  const url = new URL(requestUrl);
  if (!url.pathname.includes("//")) return null;
  const collapsed = url.pathname.replace(/\/{2,}/g, "/");
  if (!collapsed.startsWith("/") || collapsed.includes("//") || collapsed === url.pathname) {
    return null;
  }
  url.pathname = collapsed;
  if (url.origin !== new URL(requestUrl).origin) return null;
  if (url.pathname.includes("//")) return null;
  return url.toString();
}

export default async (request, context) => {
  try {
    const target = collapseSlashTarget(request.url);
    if (!target) return context.next();
    return new Response(null, {
      status: 301,
      headers: { Location: target },
    });
  } catch (_err) {
    return context.next();
  }
};

export const config = {
  // Anchored by Netlify to ^.*//.*$ so only repeated-slash paths invoke this.
  pattern: ".*//.*",
  method: ["GET", "HEAD"],
  onError: "bypass",
};
