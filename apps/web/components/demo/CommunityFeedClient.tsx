"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Gift,
  Heart,
  MessageCircle,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  activateReferralDiscount,
  addCommunityPost,
  addPostComment,
  toggleLikePost,
  useDemoFlow,
} from "@/lib/demo-flow-store";
import { cn } from "@/lib/utils";

const COMPOSER_TAGS = [
  { label: "Hair", tag: "#braids" },
  { label: "Food", tag: "#ManchesterFood" },
  { label: "Events", tag: "#ManchesterEvents" },
  { label: "Recs", tag: "#hairRecommendations" },
  { label: "Review", tag: "#communityFinds" },
] as const;

const POPULAR_TOPICS = [
  "#braids",
  "#locs",
  "#smallChops",
  "#ManchesterFood",
  "#ManchesterEvents",
  "#hairRecommendations",
  "#catering",
  "#communityFinds",
] as const;

export function CommunityFeedClient() {
  const { communityPosts } = useDemoFlow();
  const [selectedTag, setSelectedTag] = React.useState<string>("#braids");
  const [filterTag, setFilterTag] = React.useState<string | null>(null);
  const [postBody, setPostBody] = React.useState("");
  const [postArea, setPostArea] = React.useState("Hulme");
  const [openCommentsId, setOpenCommentsId] = React.useState<string | null>(null);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [copiedInvite, setCopiedInvite] = React.useState(false);

  const visiblePosts = filterTag
    ? communityPosts.filter(
        (p) =>
          p.tag.toLowerCase() === filterTag.toLowerCase() ||
          p.body.toLowerCase().includes(filterTag.toLowerCase()),
      )
    : communityPosts;

  function handlePublishPost(e: React.FormEvent) {
    e.preventDefault();
    if (!postBody.trim()) return;
    addCommunityPost({
      authorName: "Adaeze N.",
      authorArea: postArea,
      tag: selectedTag,
      body: postBody,
    });
    setPostBody("");
  }

  function handleCommentSubmit(e: React.FormEvent, postId: string) {
    e.preventDefault();
    if (!commentDraft.trim()) return;
    addPostComment(postId, "Adaeze N.", commentDraft);
    setCommentDraft("");
  }

  function handleShareInvite() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/?ref=servyn-community` : "/?ref=servyn-community";
    void navigator.clipboard?.writeText(url).catch(() => {});
    activateReferralDiscount();
    setCopiedInvite(true);
    window.setTimeout(() => setCopiedInvite(false), 2200);
  }

  return (
    <div className="bg-cream text-ink">
      {/* Header banner */}
      <section className="bg-leaf-900 px-6 py-12 text-cream lg:px-8">
        <div className="mx-auto max-w-[1140px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/35 bg-gold-400/15 px-3 py-1 text-[11px] font-bold tracking-[0.08em] uppercase text-gold-300">
            <Users className="size-3.5" aria-hidden="true" />
            <span>Community</span>
          </span>
          <h1 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
            The Servyn Community
          </h1>
          <p className="mt-2 max-w-xl text-sm text-cream-75">
            Share genuine experiences, ask for recommendations, and connect with Afro-Caribbean
            businesses across Greater Manchester.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1140px] gap-6 px-6 py-8 lg:grid-cols-[1fr_320px] lg:px-8">
        {/* Main feed */}
        <div className="space-y-5">
          {/* Post composer */}
          <form
            onSubmit={handlePublishPost}
            className="rounded-[18px] border border-line bg-surface p-5 shadow-soft"
          >
            <textarea
              rows={3}
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              placeholder="Share a tip, ask for a Manchester recommendation, or celebrate a great booking..."
              className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 p-3 text-sm text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {COMPOSER_TAGS.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setSelectedTag(item.tag)}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      selectedTag === item.tag
                        ? "bg-leaf-900 text-gold-300"
                        : "border border-line-2 bg-surface-2 text-ink-2 hover:border-gold-400",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
                <select
                  value={postArea}
                  onChange={(e) => setPostArea(e.target.value)}
                  aria-label="Your Manchester area"
                  className="rounded-full border border-line-2 bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2 focus:border-gold-500 focus:outline-none"
                >
                  <option value="Hulme">Hulme</option>
                  <option value="Salford">Salford</option>
                  <option value="Moss Side">Moss Side</option>
                  <option value="Cheetham Hill">Cheetham Hill</option>
                  <option value="Chorlton">Chorlton</option>
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-leaf-800 px-5 py-2 text-xs font-semibold text-cream hover:bg-leaf-700"
              >
                <Send className="size-3.5" aria-hidden="true" />
                <span>Post</span>
              </button>
            </div>
          </form>

          {filterTag ? (
            <div className="flex items-center justify-between rounded-lg border border-gold-300 bg-gold-50 px-4 py-2 text-xs">
              <span>
                Filtering by topic <strong>{filterTag}</strong> ({visiblePosts.length} posts)
              </span>
              <button
                type="button"
                onClick={() => setFilterTag(null)}
                className="cursor-pointer font-semibold text-leaf-700 hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : null}

          {/* Posts */}
          <div className="space-y-4">
            {visiblePosts.map((post) => {
              const commentsOpen = openCommentsId === post.id;
              return (
                <article
                  key={post.id}
                  className="rounded-[18px] border border-line bg-surface p-5 shadow-soft"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex size-9 items-center justify-center rounded-full bg-leaf-900 text-xs font-bold text-gold-300">
                        {post.authorName.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{post.authorName}</p>
                        <p className="text-[11px] text-mut">
                          {post.authorArea} · {post.createdAt.slice(0, 10)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilterTag(post.tag)}
                      className="cursor-pointer rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-bold text-mint-d"
                    >
                      {post.tag}
                    </button>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-ink-2">{post.body}</p>

                  <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleLikePost(post.id)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 font-semibold transition-colors",
                        post.likedByMe ? "text-blush-d" : "text-mut hover:text-ink",
                      )}
                    >
                      <Heart
                        className={cn("size-3.5", post.likedByMe && "fill-current")}
                        aria-hidden="true"
                      />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenCommentsId(commentsOpen ? null : post.id)}
                      className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-mut hover:text-ink"
                    >
                      <MessageCircle className="size-3.5" aria-hidden="true" />
                      <span>
                        {post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}
                      </span>
                    </button>
                  </div>

                  {commentsOpen ? (
                    <div className="mt-3 space-y-2.5 rounded-lg border border-line bg-surface-2 p-3.5">
                      {post.comments.map((cmt) => (
                        <div key={cmt.id} className="text-xs">
                          <span className="font-semibold text-ink">{cmt.authorName}: </span>
                          <span className="text-ink-2">{cmt.text}</span>
                        </div>
                      ))}
                      <form
                        onSubmit={(e) => handleCommentSubmit(e, post.id)}
                        className="flex gap-2 pt-1"
                      >
                        <input
                          type="text"
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Write a helpful reply..."
                          className="flex-1 rounded-full border border-line-2 bg-surface px-3 py-1.5 text-xs text-ink focus:border-gold-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="cursor-pointer rounded-full bg-leaf-800 px-3.5 py-1.5 text-xs font-semibold text-cream hover:bg-leaf-700"
                        >
                          Reply
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        {/* Sticky sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[18px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="font-serif text-base font-semibold text-ink">Community Guidelines</h2>
            <ul className="mt-3 space-y-2 text-xs text-mut">
              {[
                "Be respectful — this is a community space",
                "Only share genuine Manchester experiences",
                "No spam or unsolicited promotions",
                "Support local Black-owned and community businesses",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-leaf-700" aria-hidden="true" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[18px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="font-serif text-base font-semibold text-ink">Popular Topics</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {POPULAR_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setFilterTag(filterTag === topic ? null : topic)}
                  className={cn(
                    "cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                    filterTag === topic
                      ? "bg-leaf-900 text-gold-300"
                      : "bg-mint text-mint-d hover:brightness-95",
                  )}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] bg-leaf-950 p-5 text-cream shadow-lift">
            <div className="flex items-center gap-2 text-gold-300">
              <Gift className="size-4" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Referral Reward
              </span>
            </div>
            <h2 className="mt-2 font-serif text-lg font-medium">
              Invite a friend, both get 5% off
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-cream-75">
              The 5% comes off Servyn&apos;s booking fee (10% → 5%), so vendors still receive 100%
              of their agreed price.
            </p>
            <button
              type="button"
              onClick={handleShareInvite}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-semibold text-gold-ink shadow-gold hover:brightness-105"
            >
              {copiedInvite ? (
                <>
                  <Check className="size-3.5" aria-hidden="true" />
                  <span>Link copied &amp; 5% activated!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden="true" />
                  <span>Share Servyn invite link</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
