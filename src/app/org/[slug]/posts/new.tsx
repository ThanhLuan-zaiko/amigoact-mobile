import { Text } from "react-native";
import { Loading } from "@/components/common/States";
import OrgScreen from "@/components/organizations/OrgScreen";
import PostForm from "@/components/posts/PostForm";
import RequireUser from "@/components/RequireUser";
import { mutedText } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { getLinkableActivities } from "@/lib/activityApi";
import type { OrganizationDetail } from "@/lib/organizations";
import { activityOptions } from "@/lib/postActivity";
import { createPost } from "@/lib/postApi";
import { postKinds, postPath } from "@/lib/posts";
import { hasPermission } from "@/lib/roles";

function NewPostContent({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const slug = organization.slug;
  const activities = useLoad(() => getLinkableActivities(slug), [slug]);
  if (organization.viewer.status !== "active") {
    return (
      <Text className={mutedText}>
        Chỉ thành viên của tổ chức mới đăng bài được. Hãy tham gia tổ chức
        trước.
      </Text>
    );
  }
  if (activities.loading) return <Loading />;
  return (
    <PostForm
      orgSlug={slug}
      activities={activityOptions(activities.data ?? [])}
      submit={(kind, fields, intent) =>
        createPost(slug, kind, fields, intent === "draft")
      }
      kinds={postKinds(hasPermission(organization.viewer, "posts.announce"))}
      organizationName={organization.name}
      cancelHref={postPath(slug)}
      draftsHref={`${postPath(slug)}/drafts`}
    />
  );
}

export default function NewPostScreen() {
  return (
    <RequireUser>
      {() => (
        <OrgScreen>
          {(organization) => <NewPostContent organization={organization} />}
        </OrgScreen>
      )}
    </RequireUser>
  );
}
