import useAPI from "@/lib/wca/useAPI";
import { useSession } from "next-auth/react";
import { components } from "@/lib/wca/wcaSchema";
import { useQuery } from "@tanstack/react-query";

interface usePermissionsResponse {
  permissions: components["schemas"]["UserPermissions"];
  isLoading: boolean;
}

const NO_PERMISSIONS = {
  can_access_panels: { scope: [] },
  can_administer_competitions: { scope: [] },
  can_attend_competitions: { scope: [] },
  can_create_groups: { scope: [] },
  can_edit_delegate_report: { scope: [] },
  can_edit_groups: { scope: [] },
  can_organize_competitions: { scope: [] },
  can_read_groups_current: { scope: [] },
  can_read_groups_past: { scope: [] },
  can_request_to_edit_others_profile: { scope: [] },
  can_view_delegate_admin_page: { scope: [] },
  can_view_delegate_report: { scope: [] },
}

export default function usePermissions(): usePermissionsResponse {
  const { data: session } = useSession();
  const api = useAPI();
  const { data: request, isLoading } = useQuery({
    enabled: Boolean(session),
    queryKey: ["permissions", session?.user.id],
    queryFn: () => api.GET("/users/me/permissions")
  })

  if(!session){
    return {
      permissions: NO_PERMISSIONS,
      isLoading: false,
    };
  }

  return {
    isLoading,
    permissions: request?.data || NO_PERMISSIONS
  }
}
