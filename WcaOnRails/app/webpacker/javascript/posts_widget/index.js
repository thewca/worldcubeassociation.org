import React, { useState } from 'react';
import {
  Button, Card, Icon, List, Pagination,
} from 'semantic-ui-react';

import useLoadedData from '../requests/loadable';
import { postsUrl } from '../requests/routes.js.erb';
import { registerComponent } from '../wca/react-utils';
import Loading from '../requests/Loading';
import Errored from '../requests/Errored';
import { formattedTextForDate } from '../wca/utils';
import './index.scss';

const PostTitlesList = ({
  posts,
}) => (
  <List bulleted>
    {posts.map((post) => (
      <List.Item key={post.id}>
        <a href={post.url}>{post.title}</a>
      </List.Item>
    ))}
  </List>
);

const PostsList = ({
  posts,
}) => (
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
            {formattedTextForDate(post.createdAt, 'en')}
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

const PostsPagination = ({
  page,
  setPage,
  totalPages,
}) => (
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

const PostsWidget = ({
  titleOnly,
  initialPage,
}) => {
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
};

registerComponent(PostsWidget, 'PostsWidget');
