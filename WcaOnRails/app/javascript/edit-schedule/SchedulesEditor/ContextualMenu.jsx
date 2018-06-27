import React from 'react'

export const contextualMenuSelector = "#schedule-menu";

export class ContextualMenu extends React.Component {

  clickHandler = () => {
    let $menu = $(contextualMenuSelector);
    if (!$menu.hasClass("hide-element")) {
      $menu.removeClass("delete-only");
      $menu.addClass("hide-element");
    }
  }

  componentDidMount(props) {
    $(window).click(this.clickHandler);
  }

  componentWillUnmount(props) {
    $(window).off("click", this.clickHandler);
  }

  render() {
    let { actionsHandlers } = this.props;
    return (
      <ul id="schedule-menu" className="dropdown-menu hide-element" role="menu">
        <li className="edit-option">
          <a href="#" role="menuitem" onClick={actionsHandlers.editEvent}>
            <i className="fa fa-pencil"></i><span>Edit</span>
          </a>
        </li>
        <li>
          <a href="#" role="menuitem" onClick={actionsHandlers.removeEvent}>
            <i className="fa fa-trash text-danger"></i><span className="text-danger">Remove</span>
          </a>
        </li>
      </ul>
    );
  }
}
