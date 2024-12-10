import React, { useCallback, useState } from 'react';
import {
  Button, Form, FormField, Header,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import useInputState from '../../lib/hooks/useInputState';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';
import { createPost, deletePost, editPost } from './api/posts';
import { useConfirm } from '../../lib/providers/ConfirmProvider';
import UtcDatePicker from '../wca/UtcDatePicker';
import I18nHTMLTranslate from '../I18nHTMLTranslate';

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
          <Form.Input label={I18n.t('activerecord.attributes.post.title')} onChange={setFormTitle} value={formTitle} />
        </FormField>
        <FormField>
          <label>{I18n.t('activerecord.attributes.post.body')}</label>
          <MarkdownEditor onChange={setFormBody} value={formBody} />
          {/* i18n-tasks-use t('simple_form.hints.post.body') */}
          <I18nHTMLTranslate i18nKey="simple_form.hints.post.body" />
        </FormField>
        <FormField>
          <Form.Select label={I18n.t('activerecord.attributes.post.tags')} options={allTags} onChange={(_, data) => { setFormTags(data.value); }} value={formTags} multiple />
        </FormField>
        <FormField>
          <Form.Checkbox label={I18n.t('activerecord.attributes.post.sticky')} onChange={setFormIsStickied} checked={formIsStickied} />
          { formIsStickied
            && (
            <UtcDatePicker
              placeholderText={I18n.t('activerecord.attributes.post.unstick_at')}
              isoDate={unstickAt}
              onChange={(date) => setUnstickAt(date)}
            />
            ) }
        </FormField>
        <FormField>
          <Form.Checkbox label={I18n.t('activerecord.attributes.post.show_on_homepage')} onChange={setFormShowOnHomePage} checked={formShowOnHomePage} />
          <p>{I18n.t('simple_form.hints.post.show_on_homepage')}</p>
        </FormField>
        <Button type="submit" primary>{ post ? 'Update Post' : 'Create Post'}</Button>
        { post
        && <Button negative onClick={deletePostAttempt}>Delete Post</Button> }
      </Form>
    </>
  );
}
