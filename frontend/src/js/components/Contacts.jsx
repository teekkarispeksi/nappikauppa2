'use strict';

var React = require('react');
var Button = require('react-bootstrap/lib/Button');
var Input = require('react-bootstrap/lib/Input');
var _ = require('underscore');
var $ = require('jquery');

var Contacts = React.createClass({
  getInitialState: function() {
    return {
      name: '',
      email: '',
      discount_code: '',
      errors: []
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
    var errors = [];
    if (!this.state.name) {
      errors.push('name');
    }
    if (!_.contains(this.state.email, '@')) {
      errors.push('email');
    }
    if (this.state.discount_code && !this._checkDiscountCode(this.state.discount_code)) {
      errors.push('discount_code');
    }

    this.setState({errors: errors});
    if (errors.length === 0) {
      this.props.onSaveOrderInfo(_.clone(this.state));
    }
  },

  _checkDiscountCode: function(discount_code) {
    var req = $.ajax({
      url: 'api/discountCode/' + discount_code,
      async: false
    });
    return JSON.parse(req.responseText).ok === true;
  },

  render: function() {
    var active = this.props.active;
    return (
      <div className='shopping-stage contact-input'>
        <h2>Yhteystiedot <small>4/5</small></h2>
        <div>
          <Input
            label='Nimi'
            type='text'
            bsStyle={ _.contains(this.state.errors, 'name') ? ('error') : null }
            readOnly={!active}
            onChange={this.onValueChange.bind(null, 'name')}
            value={this.state.name} />
        </div>

        <div>
          <Input
            label='Sähköposti'
            type='text'
            bsStyle={ _.contains(this.state.errors, 'email') ? ('error') : null }
            readOnly={!active}
            onChange={this.onValueChange.bind(null, 'email')}
            value={this.state.email} />
        </div>

        <div>
          <Input
            label='Alennuskoodi'
            type='text'
            bsStyle={ _.contains(this.state.errors, 'discount_code') ? ('error') : null }
            readOnly={!active}
            onChange={this.onValueChange.bind(null, 'discount_code')}
            value={this.state.discount_code} />
        </div>

        <div>
          <Button id='saveOrderInfo' disabled={!active} onClick={active ? this.onSave : null}>Tallenna</Button>
        </div>
      </div>
    );
  }

});

module.exports = Contacts;
