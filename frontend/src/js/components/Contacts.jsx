"use strict";

var React = require('react');
var _ = require('underscore');

var Contacts = React.createClass({
  getInitialState: function() {
    return {
      name: '',
      email: '',
      discount_code: ''
    };
  },

  onValueChange: function(field, event) {
    // In a way this would be nicer to have in Store.jsx (Store is kind of
    // the 'controller'), but it's too slow updating the whole app with each keypress
    // Also, until the user clicks "Tallenna", no other part can need these values..
    // So at least for now, kepe these in this state and save them to the Order in
    // onSave().
    // This also allows validation here.
    var stateUpdate = {};
    stateUpdate[field] = event.target.value;
    this.setState(stateUpdate);
  },

  onSave: function() {
    this.props.onSaveOrderInfo(_.clone(this.state));
  },

  render: function () {
    var active = this.props.active;
    return (
      <div className="shopping-stage contact-input">
        <div><label>Nimi</label>        <input readOnly={!active} onChange={this.onValueChange.bind(null, 'name')}          value={this.state.name} /></div>
        <div><label>Sähköposti</label>  <input readOnly={!active} onChange={this.onValueChange.bind(null, 'email')}         value={this.state.email} /></div>
        <div><label>Alennuskoodi</label><input readOnly={!active} onChange={this.onValueChange.bind(null, 'discount_code')} value={this.state.discount_code} /></div>
        <div>{active ? (<a  id="saveOrderInfo" onClick={this.onSave}>Tallenna ja siirry maksamaan</a>) : null}</div>
      </div>
    );
  }

});

module.exports = Contacts;
