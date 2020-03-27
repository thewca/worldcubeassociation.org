import React from 'react';
import rootRender from '..';

/* eslint react/prop-types: "off" */
/* eslint import/no-cycle: "off" */
/* eslint jsx-a11y/control-has-associated-label: "off" */
/* eslint jsx-a11y/anchor-is-valid: "off" */

export default class EditRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      color: props.roomWcif.color,
    };
  }

  render() {
    const { roomWcif, removeRoomAction } = this.props;
    const { color } = this.state;

    const handleNameChange = (e) => {
      // Update parent's WCIF
      roomWcif.name = e.target.value;
      rootRender();
    };

    const handleColorChange = (e) => {
      // This is fired everytime the color changes in the color picker, *not* only when unfocused.
      // To avoid rootRendering everytime we first store the value in the state, and only update the
      // WCIF when focus is lost.
      this.setState({
        color: e.target.value,
      });
    };

    const updateColorInWcif = (e) => {
      // Update parent's WCIF
      roomWcif.color = e.target.value;
      rootRender();
    };

    return (
      <div className="row room-row">
        <div className="col-xs-9">
          <input
            type="text"
            className="room-name-input form-control"
            value={roomWcif.name}
            onChange={handleNameChange}
          />
        </div>
        <div className="col-xs-3">
          <a href="#" onClick={removeRoomAction} className="btn btn-danger pull-right"><i className="fas fa-trash" /></a>
        </div>
        <div className="col-xs-9 room-color-cell">
          <input
            type="color"
            className="form-control"
            value={color}
            onChange={handleColorChange}
            onBlur={updateColorInWcif}
          />
        </div>
      </div>
    );
  }
}
