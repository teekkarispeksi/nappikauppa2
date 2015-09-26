var React = require('react');

var Contacts = React.createClass({
  onValueChange: function(field, event) {
    // In a way this would be nicer to have in Store.jsx (Store is kind of
    // the 'controller'), but it's too slow updating the whole app with each keypress
    this.props.order.set(field, event.target.value);
    this.forceUpdate();
  },

  render: function () {
    if(this.props.order === null) {
      return (
        <div className="shopping-stage contact-input"></div>
      );
    }
    return (
      <div className="shopping-stage contact-input">
        <label>Nimi</label><input onChange={this.onValueChange.bind(null, 'name')} value={this.props.order.get('name')} />
        <label>Sähköposti</label><input onChange={this.onValueChange.bind(null, 'email')} value={this.props.order.get('email')} />
      </div>
    );
  }

});

module.exports = Contacts;
