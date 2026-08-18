import { getPayload } from "payload";
import config from "@payload-config";
import { auth } from "@/auth";
import NavbarContent from "@/app/(wca)/navbarContent";

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

export default async function Navbar() {
  const payload = await getPayload({ config });
  const [navbar, socialLinksGlobal] = await Promise.all([
    payload.findGlobal({ slug: "nav" }),
    payload.findGlobal({ slug: "social-links" }),
  ]);

  const session = await auth();
  const socialLinks = socialLinksGlobal.links ?? [];

  // Prevent people part of the Live Results Beta to escape onto the payload pages
  const navbarEntries = LIVE_RESULT_BETA ? [] : navbar.entry;

  return (
    <NavbarContent
      navbarEntries={navbarEntries}
      socialLinks={socialLinks}
      session={session}
      liveResultBeta={LIVE_RESULT_BETA}
    />
  );
}
