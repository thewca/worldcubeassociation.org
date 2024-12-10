import React, { useCallback, useState } from 'react';
import {
  Button, Form, FormField, Header,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import useInputState from '../../lib/hooks/useInputState';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';
import { createPost, deletePost, editPost } from './api/posts';
import { useConfirm } from '../../lib/providers/ConfirmProvider';
import UtcDatePicker from '../wca/UtcDatePicker';

export default function PostForm({
  header, allTags, post,
}) {
  const [formTitle, setFormTitle] = useInputState(post?.title ?? '');
  const [formBody, setFormBody] = useInputState(post?.body ?? '');
  const [formTags, setFormTags] = useState(post?.tags_array ?? []);
  const [formIsStickied, setFormIsStickied] = useCheckboxState(post?.sticky ?? false);
  const [formShowOnHomePage, setFormShowOnHomePage] = useCheckboxState(post?.show_on_homepage ?? true);
  const [unstickAt, setUnstickAt] = useState(post.unstick_at ?? null);

  const confirm = useConfirm();

  const { mutate: createMutation } = useMutation({
    mutationFn: createPost,
    onSuccess: ({ data }) => {
      window.location = data.post.url;
    },
  });

  const { mutate: editMutation } = useMutation({
    mutationFn: editPost,
    onSuccess: ({ data }) => {
      window.location = data.post.url;
    },
  });

  const { mutate: deleteMutation } = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      window.location = '/posts';
    },
  });

  const onSubmit = useCallback(() => {
    if (post.id) {
      editMutation({
        id: post.id,
        title: formTitle,
        body: formBody,
        tags: formTags,
        unstick_at: formIsStickied ? unstickAt : null,
        sticky: formIsStickied,
        show_on_homepage: formShowOnHomePage,
      });
    } else {
      createMutation({
        title: formTitle,
        body: formBody,
        tags: formTags,
        sticky: formIsStickied,
        unstick_at: formIsStickied ? unstickAt : null,
        show_on_homepage: formShowOnHomePage,
      });
    }
  }, [
    createMutation,
    editMutation,
    formBody,
    formIsStickied,
    formShowOnHomePage,
    formTags,
    formTitle,
    unstickAt,
    post.id,
  ]);

  const deletePostAttempt = useCallback((event) => {
    event.preventDefault();
    confirm({
      content: 'Do you want to delete this post?',
    }).then(() => {
      deleteMutation({
        id: post.id,
      });
    });
  }, [confirm, deleteMutation, post.id]);

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
          <Form.Checkbox label="Sticky" onChange={setFormIsStickied} checked={formIsStickied} />
          { formIsStickied
            && (
            <UtcDatePicker
              isoDate={unstickAt}
              onChange={(date) => setUnstickAt(date)}
            />
            ) }
        </FormField>
        <FormField>
          <Form.Checkbox label="Show on Homepage" onChange={setFormShowOnHomePage} checked={formShowOnHomePage} />
          <p>Careful! This is not secure for private data. This is only to prevent cluttering the homepage. Posts that are not shown on the homepage are still accessible to the public via permalink or through tags.</p>
        </FormField>
        <Button type="submit" primary>{ post ? 'Update Post' : 'Create Post'}</Button>
        { post
        && <Button negative onClick={deletePostAttempt}>Delete Post</Button> }
      </Form>
    </>
  );
}
