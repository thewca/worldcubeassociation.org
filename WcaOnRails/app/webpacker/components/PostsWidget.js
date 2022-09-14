import React, { useState } from 'react';
import {
  Button, Card, Icon, List, Pagination,
} from 'semantic-ui-react';

import useLoadedData from '../lib/hooks/useLoadedData';
import { postsUrl } from '../lib/requests/routes.js.erb';
import Loading from './Requests/Loading';
import Errored from './Requests/Errored';
import { formattedTextForDate } from '../lib/utils/wca';
import '../stylesheets/posts_widget.scss';

function PostTitlesList({
  posts,
}) {
  return (
    <List bulleted>
      {posts.map((post) => (
        <List.Item key={post.id}>
          <a href={post.url}>{post.title}</a>
        </List.Item>
      ))}
    </List>
  );
}

function PostsList({
  posts,
}) {
  return (
    <Card.Group>
      {posts.map((post) => (
        <Card key={post.id} fluid>
          <Card.Content>
            <Card.Header>
              {post.sticky && (
              <Icon name="pin" />
              )}
              <a href={post.url}>{post.title}</a>
              {post.edit_url && (
              <>
                <Button
                  circular
                  href={post.url}
                  // This uses rails-ujs to create the appropriate DELETE request.
                  data-method="delete"
                  data-confirm="Are you sure you want to delete this post?"
                  color="red"
                  floated="right"
                  icon="trash"
                />
                <Button
                  circular
                  href={post.edit_url}
                  color="teal"
                  floated="right"
                  icon="pencil"
                />
              </>
              )}
            </Card.Header>
            <Card.Meta>
              Posted by
              {' '}
              {post.author ? post.author.name : 'Unknown'}
              {' '}
              on
              {' '}
              {formattedTextForDate(post.created_at, 'en')}
            </Card.Meta>
            <Card.Description dangerouslySetInnerHTML={{ __html: post.teaser }} />
          </Card.Content>
          <Card.Content extra>
            <Button
              href={post.url}
              primary
            >
              Read full post
            </Button>
          </Card.Content>
        </Card>
      ))}
    </Card.Group>
  );
}

function PostsPagination({
  page,
  setPage,
  totalPages,
}) {
  return (
    <Pagination
      activePage={page}
      onPageChange={(e, { activePage }) => setPage(activePage)}
      totalPages={totalPages}
      boundaryRange={0}
      siblingRange={2}
      ellipsisItem={null}
      firstItem={{ content: <Icon name="angle double left" />, icon: true }}
      lastItem={{ content: <Icon name="angle double right" />, icon: true }}
      prevItem={{ content: <Icon name="angle left" />, icon: true }}
      nextItem={{ content: <Icon name="angle right" />, icon: true }}
    />
  );
}

function PostsWidget({
  titleOnly,
  initialPage,
}) {
  const [page, setPage] = useState(initialPage || 1);
  const { data, loading, error } = useLoadedData(postsUrl(page));
  return (
    <>
      {error && (
        <Errored componentName="PostsWidget" />
      )}
      {loading && (
        <Loading />
      )}
      {!loading && data && (
        <div className="posts-widget">
          {titleOnly ? (
            <PostTitlesList posts={data.posts} />
          ) : (
            <>
              <PostsList posts={data.posts} />
              <PostsPagination
                page={page}
                setPage={setPage}
                totalPages={data.totalPages}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}

export default PostsWidget;
