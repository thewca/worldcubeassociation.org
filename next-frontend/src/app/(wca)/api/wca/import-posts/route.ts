import { BasePayload, getPayload } from "payload";
import config from "@payload-config";
import {
  convertMarkdownToLexical,
  editorConfigFactory,
} from "@payloadcms/richtext-lexical";
import { User } from "@/types/payload";

type WCAPost = {
  id: number;
  title: string;
  slug: string;
  sticky: boolean;
  created_at: string;
  unstick_at: string;
  url: string;
  author_name: string;
  body: string;
  author: {
    user_id: number;
    wca_id: string;
    email: string;
    name: string;
  };
  post_tags: {
    tag: string;
  }[];
};

const findOrCreateUser = async (
  author: { email: string; name: string },
  payload: BasePayload,
) => {
  const user = await payload.find({
    collection: "users",
    where: { email: { equals: author.email } },
  });
  if (user.docs.length > 0) {
    return user.docs[0];
  }
  return payload.create({
    collection: "users",
    data: {
      email: author.email,
      name: author.name,
    },
  });
};

export async function POST(request: Request) {
  const body: WCAPost[] = await request.json();
  const c = await config;
  const defaultConfig = await editorConfigFactory.default({
    config: c, // <= make sure you have access to your Payload Config
  });
  const payload = await getPayload({ config: c });

  const convertMarkdownToLexicalJSON = (markdown: string) =>
    convertMarkdownToLexical({
      editorConfig: defaultConfig,
      markdown: markdown,
    });

  // Cache the users so we don't have to do a lookup for each post
  const users: Record<string, User> = {};

  for (let i = 0; i < body.length; i++) {
    const post = body[i];
    const publishedBy = users[post.author.email];
    if (!publishedBy) {
      users[post.author.email] = await findOrCreateUser(post.author, payload);
    }

    await payload.create({
      collection: "announcements",
      data: {
        slug: post.slug,
        title: post.title,
        // @ts-expect-error might be a payload bug?
        content: convertMarkdownToLexicalJSON(post.body),
        publishAt: post.created_at,
        sticky: post.sticky,
        unstickAt: post.unstick_at,
        publishedBy: users[post.author.email],
        approvedBy: users[post.author.email],
      },
      locale: "en",
      overrideAccess: true,
    });
  }

  return Response.json({ status: "ok" });
}
