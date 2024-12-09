import React, { useState } from 'react';
import {
  Button, Form, FormField, Header,
} from 'semantic-ui-react';
import useInputState from '../../lib/hooks/useInputState';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';

export default function PostForm({
  header, title, body, tags, allTags, isStickied, showOnHomePage,
}) {
  const [formTitle, setFormTitle] = useInputState(title ?? '');
  const [formBody, setFormBody] = useInputState(body ?? '');
  const [formTags, setFormTags] = useState(tags ?? []);
  const [formIsStickied, setFormIsStickied] = useCheckboxState(isStickied ?? false);
  const [formShowOnHomePage, setFormShowOnHomePage] = useCheckboxState(showOnHomePage ?? true);
  console.log(allTags);

  return (
    <>
      <Header>
        {header}
      </Header>
      <Form>
        <FormField>
          <Form.Input label="Title" onChange={setFormTitle} value={formTitle} />
        </FormField>
        <FormField>
          <label>Body</label>
          <MarkdownEditor onChange={setFormBody} value={formBody} />
        </FormField>
        <FormField>
          <label>Tags</label>
          <Form.Select options={allTags} onChange={setFormTags} value={formTags} multiple />
        </FormField>
        <FormField>
          <Form.Checkbox label="Sticky" onChange={setFormIsStickied} value={formIsStickied} />
        </FormField>
        <FormField>
          <Form.Checkbox label="Show on Homepage" onChange={setFormShowOnHomePage} value={formShowOnHomePage} />
          <p>Careful! This is not secure for private data. This is only to prevent cluttering the homepage. Posts that are not shown on the homepage are still accessible to the public via permalink or through tags.</p>
        </FormField>
        <Button type="submit">Create Post</Button>
      </Form>
    </>
  );
}
