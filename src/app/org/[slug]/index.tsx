import {
  OrganizationAbout,
  OrganizationGallery,
  PinnedPosts,
  RecentActivities,
} from "@/components/organizations/OrgHighlights";
import OrgScreen from "@/components/organizations/OrgScreen";

// The organization overview. The web puts about and posts in the main column
// and activities and the gallery beside them; a phone stacks them in that order.
export default function OrganizationScreen() {
  return (
    <OrgScreen>
      {(organization, slug) => (
        <>
          <OrganizationAbout organization={organization} />
          <PinnedPosts slug={slug} />
          <RecentActivities slug={slug} />
          <OrganizationGallery slug={slug} />
        </>
      )}
    </OrgScreen>
  );
}
