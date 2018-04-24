import React from 'react'
import { rootRender } from 'edit-schedule'

export class EditRoom extends React.Component {

  handleNameChange = e => {
    // Update parent's WCIF
    this.props.roomWcif.name = e.target.value;
    rootRender();
  }

  render() {
    let { roomWcif, removeRoomAction } = this.props;
    return (
      <div className="row">
        <div className="col-xs-9">
          <input type="text" className="form-control" value={roomWcif.name} onChange={this.handleNameChange} />
        </div>
        <div className="col-xs-3">
          <a href="#" onClick={removeRoomAction} className="btn btn-danger pull-right"><i className="fa fa-trash"></i></a>
        </div>
      </div>
    );
  }
}

