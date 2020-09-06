import React from 'react';

import { Placeholder } from 'semantic-ui-react';
import './Loading.scss';

const Loading = () => (
  <Placeholder className="request-loading">
    <Placeholder.Paragraph>
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
    </Placeholder.Paragraph>
  </Placeholder>
);

export default Loading;
