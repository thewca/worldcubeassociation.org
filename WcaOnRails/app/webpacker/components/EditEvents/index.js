import React from 'react';
import cn from 'classnames';
import _ from 'lodash';

import {
  saveWcif,
} from '../../lib/utils/wcif';

import EventPanel from './EventPanel';

export default class EditEvents extends React.Component {
  UNSAFE_componentWillMount() {
    const { wcifEvents } = this.props;
    this.setState({ savedWcifEvents: _.cloneDeep(wcifEvents) });
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onUnload);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onUnload);
  }

  save = () => {
    const { competitionId, wcifEvents } = this.props;

    this.setState({ saving: true });
    const onSuccess = () => this.setState({
      savedWcifEvents: _.cloneDeep(wcifEvents),
      saving: false,
    });
    const onFailure = () => this.setState({ saving: false });

    saveWcif(competitionId, { events: wcifEvents }, onSuccess, onFailure);
  };

  onUnload = (e) => {
    // Prompt the user before letting them navigate away from this page with unsaved changes.
    if (this.unsavedChanges()) {
      const confirmationMessage = 'You have unsaved changes, are you sure you want to leave?';
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }

    return null;
  };

  unsavedChanges() {
    const { savedWcifEvents } = this.state;
    const { wcifEvents } = this.props;
    return !_.isEqual(savedWcifEvents, wcifEvents);
  }

  render() {
    const {
      canAddAndRemoveEvents, canUpdateEvents, wcifEvents,
    } = this.props;
    const { saving } = this.state;

    let unsavedChanges = null;
    if (this.unsavedChanges()) {
      unsavedChanges = (
        <div className="alert alert-info">
          You have unsaved changes. Don&apos;t forget to
          {' '}
          <button
            type="button"
            onClick={this.save}
            disabled={saving}
            className={cn('btn', 'btn-default btn-primary', {
              saving,
            })}
          >
            save your changes!
          </button>
        </div>
      );
    }
    return (
      <div>
        {unsavedChanges}
        <div className="row equal">
          {wcifEvents.map((wcifEvent) => (
            <div
              key={wcifEvent.id}
              className="col-xs-12 col-sm-12 col-md-12 col-lg-4"
            >
              <EventPanel
                wcifEvents={wcifEvents}
                wcifEvent={wcifEvent}
                canAddAndRemoveEvents={canAddAndRemoveEvents}
                canUpdateEvents={canUpdateEvents}
              />
            </div>
          ))}
        </div>
        {unsavedChanges}
      </div>
    );
  }
}
