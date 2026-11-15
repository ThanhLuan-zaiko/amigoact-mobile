import { type ActionResult, changed, failed } from "./actionResult";
import { formatDateTime } from "./activities";
import { auth } from "./client";
import { failureState } from "./forms";
import { orgPath, read, send } from "./http";
import { getMyOrganizations } from "./organizationApi";
import {
  type CommentPageApi,
  type FeedFilter,
  type PostApi,
  type PostPageApi,
  parseTags,
  postPath,
  renameIssueField,
  type TrashPageApi,
  toPost,
} from "./posts";
import type { TagSuggestion } from "./tagInput";

// Ported from amigoact-fe src/lib/postApi.ts and src/app/_actions/posts.ts.

function toPage(page: PostPageApi | null) {
  if (!page) return null;
  return {
    posts: page.items.map((post) => toPost(post, formatDateTime)),
    nextBefore: page.next_before,
  };
}

export type PostListPage = NonNullable<ReturnType<typeof toPage>>;

export async function getOrgPosts(
  slug: string,
  filter: FeedFilter,
  before: string | null,
  limit = 20,
  tag: string | null = null,
): Promise<PostListPage | null> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (tag) query.set("tag", tag);
  if (filter === "announcement" || filter === "discussion") {
    query.set("kind", filter);
  }
  if (filter === "pinned") query.set("pinned_only", "true");
  if (before) query.set("before", before);
  return toPage(await read<PostPageApi>(`${orgPath(slug)}/posts?${query}`));
}

// Null when the post is missing, deleted, or hidden from this viewer.
export async function getPost(id: string) {
  const post = await read<PostApi>(`/posts/${encodeURIComponent(id)}`);
  return post ? toPost(post, formatDateTime) : null;
}

// The raw post, for the edit form, which needs the exact stored values.
export function getPostForEdit(id: string): Promise<PostApi | null> {
  return read<PostApi>(`/posts/${encodeURIComponent(id)}`);
}

export function getComments(postId: string, after: string | null) {
  const query = new URLSearchParams({ limit: "100" });
  if (after) query.set("after", after);
  return read<CommentPageApi>(
    `/posts/${encodeURIComponent(postId)}/comments?${query}`,
  );
}

export async function getOrgDrafts(slug: string) {
  return toPage(
    await read<PostPageApi>(`${orgPath(slug)}/post-drafts?limit=50`),
  );
}

export function getPostTrash(slug: string, before: string | null) {
  const query = new URLSearchParams({ limit: "20" });
  if (before) query.set("before", before);
  return read<TrashPageApi>(`${orgPath(slug)}/post-trash?${query}`);
}

// "all" is the home feed: public posts plus the viewer's own organizations'
// posts. "mine" keeps only the posts of the viewer's organizations.
export async function getFeed(
  scope: "all" | "mine",
  before: string | null,
  tag: string | null = null,
): Promise<PostListPage | null> {
  const query = new URLSearchParams({ limit: "20" });
  if (tag) query.set("tag", tag);
  if (before) query.set("before", before);
  const path = scope === "mine" ? "/feed" : "/feed/all";
  return toPage(await read<PostPageApi>(`${path}?${query}`));
}

export async function getPopularTags(): Promise<string[]> {
  const result = await read<{ items: { name: string }[] }>(
    "/feed/popular-tags",
  );
  return result ? result.items.map((tag) => tag.name) : [];
}

// The viewer's drafts in every organization they are an active member of.
export async function getMyDrafts() {
  if (!auth.accessToken()) return [];
  const organizations = (await getMyOrganizations()).filter(
    (org) => org.status === "active",
  );
  const pages = await Promise.all(
    organizations.map((org) =>
      read<PostPageApi>(`${orgPath(org.slug)}/post-drafts?limit=50`),
    ),
  );
  return pages
    .flatMap((page) => page?.items ?? [])
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((post) => toPost(post, formatDateTime));
}

// --- Actions -------------------------------------------------------------

export type PostFields = {
  visibility: string;
  title: string;
  body: string;
  tags: string;
  mediaIds: string[];
  activityId: string;
};

function postFailure(result: Parameters<typeof failed>[0]): ActionResult {
  if (result.ok) return {};
  return failureState(
    result.code,
    result.issues.map((issue) => ({
      ...issue,
      field: renameIssueField(issue.field),
    })),
  );
}

function postBody(fields: PostFields) {
  return {
    visibility: fields.visibility || null,
    title: fields.title.trim(),
    body: fields.body.trim(),
    tags: parseTags(fields.tags.trim()),
    media_ids: fields.mediaIds,
    // Empty means no activity. On an edit this removes the link.
    activity_id: fields.activityId || null,
  };
}

export async function createPost(
  slug: string,
  kind: string,
  fields: PostFields,
  draft: boolean,
): Promise<ActionResult> {
  const result = await send<{ id: string }>(`${orgPath(slug)}/posts`, "POST", {
    kind,
    ...postBody(fields),
    draft,
  });
  if (!result.ok) return postFailure(result);
  if (draft) {
    return changed({ success: "Đã lưu bản nháp. Chỉ bạn nhìn thấy bài này." });
  }
  return changed({ next: postPath(slug, result.data.id) });
}

async function publishDraftNow(
  slug: string,
  postId: string,
): Promise<ActionResult> {
  const result = await send(`/posts/${encodeURIComponent(postId)}/publish`);
  if (!result.ok) return failed(result);
  return changed({ next: postPath(slug, postId) });
}

export async function updatePost(
  slug: string,
  postId: string,
  isDraft: boolean,
  fields: PostFields,
  intent: "save" | "publish",
): Promise<ActionResult> {
  const result = await send(
    `/posts/${encodeURIComponent(postId)}`,
    "PATCH",
    postBody(fields),
  );
  if (!result.ok) return postFailure(result);
  if (isDraft && intent === "publish") return publishDraftNow(slug, postId);
  if (isDraft) return changed({ success: "Đã lưu bản nháp." });
  return changed({ next: postPath(slug, postId) });
}

export function publishDraft(slug: string, postId: string) {
  return publishDraftNow(slug, postId);
}

// A draft is removed for good. A published post goes to the trash.
export async function deletePost(
  postId: string,
  next: string,
): Promise<ActionResult> {
  const result = await send(`/posts/${encodeURIComponent(postId)}`, "DELETE");
  if (!result.ok) return failed(result);
  return changed({ next });
}

export async function setPinned(
  postId: string,
  pinned: boolean,
): Promise<ActionResult> {
  const verb = pinned ? "pin" : "unpin";
  const result = await send(`/posts/${encodeURIComponent(postId)}/${verb}`);
  if (!result.ok) return failed(result);
  return changed({ success: pinned ? "Đã ghim bài." : "Đã bỏ ghim." });
}

export async function setHidden(
  postId: string,
  hidden: boolean,
): Promise<ActionResult> {
  const verb = hidden ? "hide" : "unhide";
  const result = await send(`/posts/${encodeURIComponent(postId)}/${verb}`);
  if (!result.ok) return failed(result);
  return changed({
    success: hidden ? "Đã ẩn bài khỏi bảng tin." : "Đã hiện lại bài.",
  });
}

export async function restorePost(postId: string): Promise<ActionResult> {
  const result = await send(`/posts/${encodeURIComponent(postId)}/restore`);
  if (!result.ok) return failed(result);
  return changed({ success: "Đã khôi phục bài viết." });
}

export async function purgePost(postId: string): Promise<ActionResult> {
  const result = await send(
    `/posts/${encodeURIComponent(postId)}/purge`,
    "DELETE",
  );
  if (!result.ok) return failed(result);
  return changed({ success: "Đã xóa vĩnh viễn bài viết." });
}

// Posts and activities share one tag catalog per organization, but each form
// suggests the tags its own kind uses most. A failure gives an empty list.
export type TagSource = "post" | "activity";

const TAG_ENDPOINTS: Record<TagSource, string> = {
  post: "post-tags",
  activity: "activity-tags",
};

export async function searchTags(
  slug: string,
  source: TagSource,
  query: string,
): Promise<TagSuggestion[]> {
  const params = new URLSearchParams({ q: query.slice(0, 40), limit: "8" });
  const result = await read<{ items: TagSuggestion[] }>(
    `${orgPath(slug)}/${TAG_ENDPOINTS[source]}?${params}`,
  );
  return result?.items ?? [];
}
