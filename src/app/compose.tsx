import { Redirect } from "expo-router";
import { Loading } from "@/components/common/States";
import RequireUser from "@/components/RequireUser";
import Page from "@/components/shell/Page";
import { useLoad } from "@/hooks/useLoad";
import { getMyOrganizations } from "@/lib/organizationApi";
import { postableOrganizations } from "@/lib/posts";

// Posts are written inside an organization, at /org/{slug}/posts/new. Old
// links land here: with one organization to post in, go straight to its form,
// otherwise go to the organization list to pick one.
function ComposeRedirect() {
  const choices = useLoad(
    async () => postableOrganizations(await getMyOrganizations(), "discussion"),
    [],
  );
  if (!choices.data) {
    return (
      <Page>
        <Loading label="Đang chuyển hướng…" />
      </Page>
    );
  }
  const only = choices.data.length === 1 ? choices.data[0] : null;
  return (
    <Redirect
      href={(only ? `/org/${only.slug}/posts/new` : "/organizations") as never}
    />
  );
}

export default function ComposeScreen() {
  return <RequireUser>{() => <ComposeRedirect />}</RequireUser>;
}
