'use strict';

var React = require('react');
var Modal = require('react-bootstrap/lib/Modal');
var Button = require('react-bootstrap/lib/Button');

var Modal_ = React.createClass({
  getInitialState: function() {
    return {visible: true};
  },

  close: function() {
    this.setState({visible: false});
  },

  acceptAndClose: function() {
    this.close();
    this.props.onAccept();
  },

  render: function() {
    return (
      <Modal onHide={this.close} show={this.state.visible} backdrop={true}>
        <Modal.Header>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.children}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.acceptAndClose}>{this.props.acceptText}</Button>
          <Button onClick={this.close} bsStyle='primary'>Peruuta</Button>
        </Modal.Footer>
      </Modal>
    );
  }

});

module.exports = Modal_;
