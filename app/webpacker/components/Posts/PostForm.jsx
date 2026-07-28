import React, {
  useCallback, useMemo, useState,
} from 'react';
import {
  Button, Checkbox, Form, FormField, FormGroup, Header, Message,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import useInputState from '../../lib/hooks/useInputState';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';
import { createPost, editPost } from './api/posts';
import UtcDatePicker from '../wca/UtcDatePicker';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import useUnsavedChangesAlert from '../../lib/hooks/useUnsavedChangesAlert';

export default function PostForm({
  header, allTags, post,
}) {
  const [formTitle, setFormTitle] = useInputState(post?.title ?? '');
  const [formBody, setFormBody] = useInputState(post?.body ?? '');
  const [formTags, setFormTags] = useState(post?.tags_array ?? []);
  const [formIsStickied, setFormIsStickied] = useCheckboxState(post?.sticky ?? false);
  const [
    formShowOnHomePage,
    setFormShowOnHomePage,
  ] = useCheckboxState(post?.show_on_homepage ?? true);
  const [postURL, setPostURL] = useInputState(post?.url ?? null);
  const [postId, setPostId] = useInputState(post?.id ?? null);
  const [unstickAt, setUnstickAt] = useState(post?.unstick_at ?? null);

  const unsavedChanges = useMemo(() => {
    const initial = {
      title: post?.title ?? '',
      body: post?.body ?? '',
      tags: post?.tags_array ?? [],
      sticky: post?.sticky ?? false,
      show_on_homepage: post?.show_on_homepage ?? true,
      unstick_at: post?.unstick_at ?? null,
    };

    const current = {
      title: formTitle,
      body: formBody,
      tags: formTags,
      sticky: formIsStickied,
      show_on_homepage: formShowOnHomePage,
      unstick_at: unstickAt,
    };

    return !_.isEqual(initial, current);
  }, [post, formTitle, formBody, formTags, formIsStickied, unstickAt, formShowOnHomePage]);

  const tagOptions = useMemo(
    () => allTags.map((tag) => ({ value: tag, text: tag, key: tag })),
    [allTags],
  );

  const { mutate: createMutation, isSuccess: postCreated, error: createError } = useMutation({
    mutationFn: createPost,
    onSuccess: ({ data }) => {
      setPostURL(data.post.url);
      setPostId(data.post.id);
      window.history.replaceState({}, '', `${data.post.url}/edit`);
    },
  });

  const { mutate: editMutation, error: editError, isSuccess: postUpdated } = useMutation({
    mutationFn: editPost,
    onSuccess: ({ data }) => {
      setPostURL(data.post.url);
      setPostId(data.post.id);
    },
  });

  const { errors } = (createError?.json || editError?.json || {});

  const onSubmit = useCallback(() => {
    if (postId) {
      editMutation({
        id: postId,
        title: formTitle,
        body: formBody,
        tags: formTags.join(','),
        unstick_at: formIsStickied ? unstickAt : null,
        sticky: formIsStickied,
        show_on_homepage: formShowOnHomePage,
      });
    } else {
      createMutation({
        title: formTitle,
        body: formBody,
        tags: formTags.join(','),
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
    postId,
  ]);

  useUnsavedChangesAlert(unsavedChanges);

  return (
    <>
      <Header>
        {header}
      </Header>
      <Form onSubmit={onSubmit}>
        <Form.Input label={I18n.t('activerecord.attributes.post.title')} onChange={setFormTitle} value={formTitle} />
        <FormField>
          <label htmlFor="post-body">{I18n.t('activerecord.attributes.post.body')}</label>
          <MarkdownEditor id="post-body" onChange={setFormBody} value={formBody} />
          {/* i18n-tasks-use t('simple_form.hints.post.body') */}
          <I18nHTMLTranslate i18nKey="simple_form.hints.post.body" />
        </FormField>
        <Form.Select label={I18n.t('activerecord.attributes.post.tags')} options={tagOptions} onChange={(_, data) => { setFormTags(data.value); }} value={formTags} multiple />
        <FormGroup inline>
          <Form.Checkbox label={I18n.t('activerecord.attributes.post.sticky')} onChange={setFormIsStickied} checked={formIsStickied} />
          { formIsStickied
            && (
              <FormField>
                <label htmlFor="unstick-at">{I18n.t('activerecord.attributes.post.unstick_at')}</label>
                <UtcDatePicker
                  id="unstick-at"
                  placeholderText={I18n.t('activerecord.attributes.post.unstick_at')}
                  isoDate={unstickAt}
                  onChange={(date) => setUnstickAt(date)}
                />
              </FormField>
            ) }
        </FormGroup>
        <Form.Field>
          <Checkbox label={I18n.t('activerecord.attributes.post.show_on_homepage')} onChange={setFormShowOnHomePage} checked={formShowOnHomePage} />
          <p className="help-block">{I18n.t('simple_form.hints.post.show_on_homepage')}</p>
        </Form.Field>
        { errors && (
          <Message negative>
            <Message.Header>Request Failed:</Message.Header>
            <Message.List>
              {(Object.keys(errors).map((err) => (
                <Message.Item>
                  {err}
                  {' '}
                  {errors[err].join(',')}
                </Message.Item>
              )))}
            </Message.List>
          </Message>
        )}
        {postCreated && !postUpdated && (
          <Message positive>
            Post successfully created. View it
            {' '}
            <a href={postURL}>here</a>
            .
          </Message>
        )}
        {postUpdated && (
          <Message positive>
            Post successfully updated. View it
            {' '}
            <a href={postURL}>here</a>
            .
          </Message>
        )}
        <Button type="submit" primary>{ postId ? 'Update Post' : 'Create Post'}</Button>
      </Form>
    </>
  );
}
