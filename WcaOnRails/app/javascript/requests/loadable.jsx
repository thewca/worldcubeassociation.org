import React, { useEffect, useState } from 'react';
import { fetchJsonOrError } from './fetchWithAuthenticityToken';

// This is a HOC that can be used to get a data from the website (as json)
// It assumes that:
//   - urlHelper is a function which takes one parameter: an identifier of the
//   resource to get.
//   - 'id' is passed in the props, and is an identifier of the resource
//   (passed to the urlHelper).
//   - 'loadedState' is pass down to the wrapped component.
// Example of usage:
// const ModelComponent = loadableComponent(id => { /* component stuff */ }, id => `path/to/resource/${id}`;);
export const loadableComponent = (WrappedComponent, urlHelper) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        loadedState: props.loadedState,
      };
    }

    loadState = () => {
      if (this.props.id) {
        fetchJsonOrError(urlHelper(this.props.id))
          .then(loadedState => {
            this.setState({ loadedState });
          });
      }
    };

    componentDidMount() {
      this.loadState();
    }

    componentWillUnmount() {
      this.loadState();
    }

    componentDidUpdate(prevProps) {
      if (this.props.id != prevProps.id) {
        this.loadState();
      }
    }

    render() {
      return <WrappedComponent {...this.props} loadedState={this.state.loadedState || this.props.loadedState} />;
    }
  };
};
