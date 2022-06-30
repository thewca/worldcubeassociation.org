import React from 'react';
import ReactDOM from 'react-dom';

export default class RadioGroup extends React.Component {
  get value() {
    const formGroupDom = ReactDOM.findDOMNode(this.formGroup);
    return formGroupDom.querySelector('input:checked').value;
  }

  render() {
    const {
      children, name, value, onChange,
    } = this.props;

    return (
      <div ref={(c) => {
        this.formGroup = c;
      }}
      >
        {children.map((child) => React.cloneElement(child, {
          name,
          key: child.props.value,
          checked: value === child.props.value,
          onChange,
        }))}
      </div>
    );
  }
}
