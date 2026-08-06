const PLACEHOLDER_POSTS = Array.from({ length: 8 }).map((_, i) => ({
  id: i,
  platform: i % 3 === 0 ? "TikTok" : i % 3 === 1 ? "Instagram" : "Facebook",
}));

/**
 * MOCK grid — INTEGRATION POINT: replace with the Instagram Graph API
 * (Business account, `/me/media`), the TikTok Display API, and Facebook
 * Page Feed, fetched server-side and revalidated (e.g. every hour) rather
 * than client-embedded widgets, for performance and to avoid third-party
 * script weight on the Lighthouse budget.
 */
export default function SocialWall() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {PLACEHOLDER_POSTS.map((post) => (
        <div
          key={post.id}
          className="card-surface flex aspect-square items-center justify-center bg-gradient-to-br from-ohia-800/40 to-lava-900/40 text-xs font-medium text-stone-400"
        >
          {post.platform} post
        </div>
      ))}
    </div>
  );
}
