import React from 'react';

export const contextualMenuSelector = '#schedule-menu';

/* eslint react/prop-types: "off" */
/* eslint jsx-a11y/anchor-is-valid: "off" */

const clickHandler = () => {
  const $menu = $(contextualMenuSelector);
  if (!$menu.hasClass('hide-element')) {
    $menu.removeClass('delete-only');
    $menu.addClass('hide-element');
  }
};

export class ContextualMenu extends React.Component {
  componentDidMount() {
    $(window).click(clickHandler);
  }

  componentWillUnmount() {
    $(window).off('click', clickHandler);
  }

  render() {
    const { actionsHandlers } = this.props;
    return (
      <ul id="schedule-menu" className="dropdown-menu hide-element" role="menu">
        <li className="edit-option">
          <a href="#" role="menuitem" onClick={actionsHandlers.editEvent}>
            <i className="fas fa-pencil-alt" />
            <span>Edit</span>
          </a>
        </li>
        <li>
          <a href="#" role="menuitem" onClick={actionsHandlers.removeEvent}>
            <i className="fas fa-trash text-danger" />
            <span className="text-danger">Remove</span>
          </a>
        </li>
      </ul>
    );
  }
}
