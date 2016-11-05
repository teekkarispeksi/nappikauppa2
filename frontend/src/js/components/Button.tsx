import React = require('react');
import Bootstrap = require('react-bootstrap');

interface IButtonState {
  disabled: boolean;
}

/* A Button that gets disabled when clicked, to prevent accidental double clicking. Also prevents the onClick form triggering
if the Button is disabled. */
export default class Button extends React.Component<Bootstrap.ButtonProps, IButtonState> {
  timer: any;

  constructor(props: Bootstrap.ButtonProps) {
    super(props);
    this.state = {disabled: false};
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  onClick(event) {
    if (!(this.props.disabled || this.state.disabled)) {
      this.setState({disabled: true});
      this.timer = setTimeout(() => this.setState({disabled: false}), 1000);
      this.props.onClick(event);
    }
  }

  render() {
    return (<Bootstrap.Button {...this.props} onClick={this.onClick.bind(this)} disabled={this.props.disabled || this.state.disabled}>{this.props.children}</Bootstrap.Button>);
  }
}
