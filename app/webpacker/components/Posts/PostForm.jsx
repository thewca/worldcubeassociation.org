import React, { useCallback, useState } from 'react';
import {
  Button, Form, FormField, Header,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import useInputState from '../../lib/hooks/useInputState';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';
import { createOrEditPost } from './api/posts';

export default function PostForm({
  header, allTags, post,
}) {
  console.log(post);
  const [formTitle, setFormTitle] = useInputState(post?.title ?? '');
  const [formBody, setFormBody] = useInputState(post?.body ?? '');
  const [formTags, setFormTags] = useState(post?.tags ?? []);
  const [formIsStickied, setFormIsStickied] = useCheckboxState(post?.sticky ?? false);
  const [formShowOnHomePage, setFormShowOnHomePage] = useCheckboxState(post?.world_readable ?? true);

  const { mutate } = useMutation({
    mutationFn: createOrEditPost,
    onSuccess: ({ data }) => {
      window.location = data.post.url;
    },
  });

  const onSubmit = useCallback(() => {
    mutate({
      id: post.id,
      title: formTitle,
      body: formBody,
      tags: formTags,
      sticky: formIsStickied,
    });
  }, [formBody, formIsStickied, formTags, formTitle, mutate, post.id]);

  return (
    <>
      <Header>
        {header}
      </Header>
      <Form onSubmit={onSubmit}>
        <FormField>
          <Form.Input label="Title" onChange={setFormTitle} value={formTitle} />
        </FormField>
        <FormField>
          <label>Body</label>
          <MarkdownEditor onChange={setFormBody} value={formBody} />
        </FormField>
        <FormField>
          <label>Tags</label>
          <Form.Select options={allTags} onChange={(_, data) => { setFormTags(data.value); }} value={formTags} multiple />
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
