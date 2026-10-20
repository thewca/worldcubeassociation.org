import { hasRole } from "@delmaredigital/payload-better-auth";
import { WCA_ROLES_FIELD } from "@/auth.config";

// Approximates `User#admin?` in Rails, which on the live site only admits `wst_admin`.
const ADMIN_ROLES = ["wst", "wst_admin"];

// Mirrors `User#can_create_posts?` in Rails. Higher-permission officers are covered there too,
//   but they are not part of the `roles` claim, so they cannot be recognized here.
const POST_CREATOR_ROLES = [
  "wic",
  "wrc",
  "wct",
  "wapc",
  "wcat",
  "wrt",
  "board",
];

const teamAccess = (teams: string[]) =>
  hasRole([...ADMIN_ROLES, ...teams], WCA_ROLES_FIELD);

export const canCreatePosts = teamAccess(POST_CREATOR_ROLES);
export const archiveTeamAccess = teamAccess(["wat"]);
export const regulationsCommitteeAccess = teamAccess(["wrc"]);
export const qualityTeamAccess = teamAccess(["wqac"]);
export const marketingTeamAccess = teamAccess(["wmt"]);

// Announcements embed images, so everyone allowed to post must be able to upload them.
export const canUploadMedia = teamAccess(["wmt", ...POST_CREATOR_ROLES]);
