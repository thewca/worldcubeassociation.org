import React, { useCallback, useState } from 'react';
import {
  Button, Form, FormField, Header, Message,
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
  const [formPost, setFormPost] = useState(post);
  const [formTitle, setFormTitle] = useInputState(formPost?.title ?? '');
  const [formBody, setFormBody] = useInputState(formPost?.body ?? '');
  const [formTags, setFormTags] = useState(formPost?.tags_array ?? []);
  const [formIsStickied, setFormIsStickied] = useCheckboxState(formPost?.sticky ?? false);
  const [formShowOnHomePage, setFormShowOnHomePage] = useCheckboxState(formPost?.show_on_homepage ?? true);
  const [unstickAt, setUnstickAt] = useState(formPost?.unstick_at ?? null);

  const { mutate: createMutation, isSuccess: postCreated, error: createError } = useMutation({
    mutationFn: createPost,
    onSuccess: ({ data }) => {
      setFormPost(data.post);
      window.history.replaceState({}, '', `${data.post.url}/edit`);
    },
  });

  const { mutate: editMutation, error: editError, isSuccess: postUpdated } = useMutation({
    mutationFn: editPost,
    onSuccess: ({ data }) => {
      setFormPost(data.post);
    },
  });

  const { errors } = (createError?.json || editError?.json || {});

  const onSubmit = useCallback(() => {
    if (formPost?.id) {
      editMutation({
        id: formPost.id,
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
    formPost?.id,
  ]);

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
        { postCreated && (
        <Message positive>
          Post successfully created. View it
          {' '}
          <a href={formPost.url}>here</a>
        </Message>
        )}
        { postUpdated && (
          <Message positive>
            Post successfully updated. View it
            {' '}
            <a href={formPost.url}>here</a>
          </Message>
        )}
        <Button type="submit" primary>{ formPost ? 'Update Post' : 'Create Post'}</Button>
      </Form>
    </>
  );
}
