import { router } from "expo-router";
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import { appPath } from "@/lib/appPath";
import type { PostFields } from "@/lib/postApi";
import { applyFormat } from "@/lib/postFormat";
import { insertMediaToken, removeMediaToken } from "@/lib/postMedia";
import { type PostKind, validatePost } from "@/lib/posts";
import { tagFieldValue } from "@/lib/tagInput";
import { follow } from "../common/ActionButton";
import { IconButton } from "../common/Button";
import SelectMenu from "../common/SelectMenu";
import BodyField, { type Selection } from "../compose/BodyField";
import MediaField from "../compose/MediaField";
import TagInput from "../compose/TagInput";
import { usePostMedia } from "../compose/usePostMedia";
import { FormMessage } from "../FormParts";
import { InputField } from "../forms/Fields";
import { mutedText, panel } from "../ui";
import { KindPicker, PostFormFooter } from "./PostFormParts";

export type PostFormInitial = {
  kind: PostKind;
  visibility: string;
  title: string;
  body: string;
  tags: string[];
  media: { id: string; mime: string }[];
  activityId: string | null;
  isDraft: boolean;
};

// The post form, ported from the web PostForm. `submit` gets the intent too.
export default function PostForm({
  submit,
  orgSlug,
  activities,
  kinds,
  organizationName,
  cancelHref,
  draftsHref,
  initial,
}: {
  submit: (
    kind: PostKind,
    fields: PostFields,
    intent: "draft" | "publish",
  ) => Promise<ActionResult>;
  orgSlug: string;
  activities: { value: string; label: string }[];
  kinds: PostKind[];
  organizationName: string;
  cancelHref: string;
  draftsHref: string;
  initial?: PostFormInitial;
}) {
  const editing = initial !== undefined;
  const [kind, setKind] = useState<PostKind>(
    initial?.kind ?? kinds[kinds.length - 1] ?? "discussion",
  );
  const [visibility, setVisibility] = useState(initial?.visibility ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [activityId, setActivityId] = useState(initial?.activityId ?? "");
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);

  function placeMedia(id: string) {
    setBody((current) => {
      const result = insertMediaToken(current, selectionRef.current.end, id);
      setSelection({ start: result.cursor, end: result.cursor });
      return result.text;
    });
  }

  const media = usePostMedia(initial?.media ?? [], placeMedia);
  const shownKinds = editing ? [kind] : kinds;
  const showDraftButton = !editing || initial.isDraft;

  async function send(intent: "draft" | "publish") {
    if (pending) return;
    const tagText = tagFieldValue(tags, tagDraft);
    const errors = validatePost({
      title,
      body,
      tags: tagText,
      kind,
      visibility,
      mediaCount: media.items.length,
    });
    if (Object.keys(errors).length > 0) {
      setState({ fieldErrors: errors });
      return;
    }
    setPending(true);
    try {
      const result = await submit(
        kind,
        {
          visibility,
          title,
          body,
          tags: tagText,
          mediaIds: media.items.map((item) => item.id),
          activityId,
        },
        intent,
      );
      setState(result);
      // A new post clears after a draft save; an edit keeps what was typed.
      if (result.success && !editing) {
        setTitle("");
        setBody("");
        setTags([]);
        setTagDraft("");
        setActivityId("");
        media.reset();
      }
      follow(result, true);
    } catch {
      setState({ error: "Mất kết nối. Vui lòng thử lại." });
    } finally {
      setPending(false);
    }
  }

  const errors = state.fieldErrors;
  return (
    <View className={`${panel} gap-5 p-4`}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <View className="min-w-0 flex-1">
          <Text
            accessibilityRole="header"
            className="font-body-semibold text-xl text-slate-900 dark:text-slate-100"
          >
            {editing ? "Sửa bài viết" : "Tạo bài viết"}
          </Text>
          <Text numberOfLines={1} className={mutedText}>
            {organizationName}
          </Text>
        </View>
        <IconButton
          icon="x"
          label="Đóng"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace(appPath(cancelHref) as never);
          }}
        />
      </View>

      <FormMessage state={state} />

      <KindPicker
        kinds={shownKinds}
        kind={kind}
        locked={editing}
        onChange={setKind}
      />
      <SelectMenu
        label="Hiển thị"
        value={visibility}
        onChange={setVisibility}
        options={[
          ...(editing ? [] : [{ value: "", label: "Mặc định theo loại bài" }]),
          { value: "public", label: "Công khai" },
          { value: "members", label: "Chỉ thành viên" },
        ]}
      />

      <InputField
        label="Tiêu đề"
        value={title}
        onChangeText={setTitle}
        maxLength={160}
        hint="Cần có ít nhất một chữ cái."
        error={errors?.post_title}
        required
      />

      <BodyField
        value={body}
        selection={selection}
        onChange={setBody}
        onSelection={setSelection}
        onFormat={(action) => {
          const result = applyFormat(
            body,
            selection.start,
            selection.end,
            action,
          );
          setBody(result.text);
          setSelection({ start: result.start, end: result.end });
        }}
        onPickImages={() => media.pick("images")}
        onPickVideos={() => media.pick("videos")}
        disabled={media.busy}
        error={errors?.post_body}
      />
      <MediaField
        items={media.items}
        busy={media.busy}
        failures={media.failures}
        error={errors?.media_ids}
        onInsert={(item) => placeMedia(item.id.toLowerCase())}
        onRemove={(item) => {
          media.remove(item);
          setBody((current) => removeMediaToken(current, item.id));
        }}
        onFocus={media.setFocus}
      />

      {activities.length > 0 ? (
        <View className="gap-1">
          <SelectMenu
            label="Hoạt động liên quan"
            value={activityId}
            onChange={setActivityId}
            options={[
              { value: "", label: "Không gắn hoạt động" },
              ...activities,
            ]}
          />
          {errors?.activity_id ? (
            <Text className="font-body text-sm text-red-700 dark:text-red-400">
              {errors.activity_id}
            </Text>
          ) : null}
        </View>
      ) : null}

      <TagInput
        orgSlug={orgSlug}
        tags={tags}
        draft={tagDraft}
        onChange={(nextTags, nextDraft) => {
          setTags(nextTags);
          setTagDraft(nextDraft);
        }}
        error={errors?.post_tags}
      />

      <PostFormFooter
        draftsHref={draftsHref}
        showDraftButton={showDraftButton}
        saving={editing && !initial.isDraft}
        pending={pending}
        onDraft={() => send("draft")}
        onPublish={() => send("publish")}
      />
    </View>
  );
}
