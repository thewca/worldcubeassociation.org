import { getPayload } from "payload";
import config from "@payload-config";
import {
  convertMarkdownToLexical,
  editorConfigFactory,
} from "@payloadcms/richtext-lexical";

type WCAPost = {
  id: number;
  title: string;
  slug: string;
  sticky: boolean;
  created_at: string;
  url: string;
  author_name: string;
  body: string;
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

  await Promise.all(
    body.map(async (post) =>
      payload.create({
        collection: "posts",
        data: {
          title: post.title,
          "author name": post.author_name,
          slug: post.slug,
          sticky: post.sticky,
          // @ts-expect-error payload still marks this as string even though it is richText
          body: convertMarkdownToLexicalJSON(post.body),
        },
        locale: "en",
        fallbackLocale: false,
        overrideAccess: true,
      }),
    ),
  );

  return Response.json({ status: "ok" });
}
