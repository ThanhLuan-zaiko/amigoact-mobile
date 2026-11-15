import { type ActionResult, changed, failed } from "./actionResult";
import { failureState } from "./forms";
import { send } from "./http";
import { validateComment } from "./posts";

// Ported from amigoact-fe src/app/_actions/comments.ts.

function commentFailure(
  code: string,
  issues: { field: string; type: string }[],
): ActionResult {
  // The comment box is named comment_body, because "body" is the post text elsewhere.
  return failureState(
    code,
    issues.map((issue) => ({
      ...issue,
      field: issue.field === "body" ? "comment_body" : issue.field,
    })),
  );
}

export async function addComment(
  postId: string,
  text: string,
): Promise<ActionResult> {
  const body = text.trim();
  const problem = validateComment(body);
  if (problem) return { fieldErrors: { comment_body: problem } };
  const result = await send(
    `/posts/${encodeURIComponent(postId)}/comments`,
    "POST",
    { body },
  );
  if (!result.ok) return commentFailure(result.code, result.issues);
  return changed({ success: "Đã gửi bình luận." });
}

// The backend allows an edit only for the author, within 15 minutes of writing.
export async function editComment(
  commentId: string,
  text: string,
): Promise<ActionResult> {
  const body = text.trim();
  const problem = validateComment(body);
  if (problem) return { fieldErrors: { comment_body: problem } };
  const result = await send(
    `/comments/${encodeURIComponent(commentId)}`,
    "PATCH",
    { body },
  );
  if (!result.ok) return commentFailure(result.code, result.issues);
  return changed({ success: "Đã sửa bình luận." });
}

// A soft delete: the comment keeps its place and a manager can restore it.
export async function deleteComment(commentId: string): Promise<ActionResult> {
  const result = await send(
    `/comments/${encodeURIComponent(commentId)}`,
    "DELETE",
  );
  return result.ok ? changed({}) : failed(result);
}

export async function restoreComment(commentId: string): Promise<ActionResult> {
  const result = await send(
    `/comments/${encodeURIComponent(commentId)}/restore`,
  );
  return result.ok ? changed({}) : failed(result);
}
