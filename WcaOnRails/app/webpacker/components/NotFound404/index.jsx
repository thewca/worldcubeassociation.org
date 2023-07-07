import React from 'react';
import '../../stylesheets/404.scss';
import { Helmet } from 'react-helmet';

export default function NotFound404() {
  return (
    <>
      <Helmet>
        <title>The page you were looking for doesn't exist (404)</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Helmet>

      <div className="rails-default-error-page">
        <div className="dialog">
          <div>
            <h1>The page you were looking for doesn't exist.</h1>
            <p>You may have mistyped the address or the page may have moved.</p>
          </div>
          <p>If you are the application owner check the logs for more information.</p>
        </div>
      </div>
    </>
  );
}
