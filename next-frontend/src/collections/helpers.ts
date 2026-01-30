import type { SerializedEditorState } from "lexical";
import type { Field, RichTextField } from "payload";

import {
  convertLexicalToMarkdown,
  editorConfigFactory,
} from "@payloadcms/richtext-lexical";

// This is stolen (and very slightly modified to allow for generic field names)
// via https://payloadcms.com/docs/rich-text/converting-markdown#example-outputting-markdown-from-the-collection
export const markdownConvertedField = (
  originalName: string,
  convertedName: string = `${originalName}Markdown`,
): Field => {
  return {
    name: convertedName,
    type: "textarea",
    admin: {
      hidden: true,
    },
    hooks: {
      afterRead: [
        ({ siblingData, siblingFields }) => {
          const data: SerializedEditorState = siblingData[originalName];

          if (!data) {
            return "";
          }

          return convertLexicalToMarkdown({
            data,
            editorConfig: editorConfigFactory.fromField({
              field: siblingFields.find(
                (field) => "name" in field && field.name === originalName,
              ) as RichTextField,
            }),
          });
        },
      ],
    },
    virtual: true,
  };
};
