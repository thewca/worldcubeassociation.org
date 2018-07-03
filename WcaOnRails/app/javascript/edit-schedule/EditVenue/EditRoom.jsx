import React from 'react'
import { rootRender } from 'edit-schedule'

export class EditRoom extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      color: props.roomWcif.color,
    };
  }

  handleNameChange = e => {
    // Update parent's WCIF
    this.props.roomWcif.name = e.target.value;
    rootRender();
  }

  handleColorChange = e => {
    // This is fired everytime the color changes in the color picker, *not* only when unfocused.
    // To avoid rootRendering everytime we first store the value in the state, and only update the
    // WCIF when focus is lost.
    this.setState({
      color: e.target.value,
    });
  }

  updateColorInWcif = e => {
    // Update parent's WCIF
    this.props.roomWcif.color = e.target.value;
    rootRender();
  }

  render() {
    let { roomWcif, removeRoomAction } = this.props;
    return (
      <div className="row room-row">
        <div className="col-xs-9">
          <input type="text" className="form-control" value={roomWcif.name} onChange={this.handleNameChange} />
        </div>
        <div className="col-xs-3">
          <a href="#" onClick={removeRoomAction} className="btn btn-danger pull-right"><i className="fa fa-trash"></i></a>
        </div>
        <div className="col-xs-9 room-color-cell">
          <input type="color" className="form-control" value={this.state.color} onChange={this.handleColorChange} onBlur={this.updateColorInWcif} />
        </div>
      </div>
    );
  }
}

