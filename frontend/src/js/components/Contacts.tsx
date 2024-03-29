'use strict';

import React = require('react');
import Bootstrap = require('react-bootstrap');
import _ = require('underscore');
import $ = require('jquery');

import Button from './Button';


/**
 * From html spec for form input type email.
 * Source: https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type=email)
 */
const EMAIL_TEST_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Test utility for checking if value is valid email.
 *
 * Implementation uses REGEXP and follows HTML form input
 * type email specification.
 */
function isValidEmail(email: string): boolean {
  return EMAIL_TEST_REGEX.test(email);
}

export interface IContactsProps {
  active: boolean;
  discount_code?: string;
  email?: string;
  name?: string;
  production_id: number;
  onSaveOrderInfo: Function;
  onCancel: React.EventHandler<React.MouseEvent<any>>;
}

export interface IContactsState {
  name?: string;
  email?: string;
  discount_code?: string;
  /** Currently means that user wants to join our email info list */
  wants_email?: boolean;
  errors?: string[];
}

export default class Contacts extends React.Component<IContactsProps, IContactsState> {

  constructor(props) {
    super(props);

    this.state = {
      name: props.name ? props.name : '',
      email: props.email ? props.email : '',
      discount_code: props.discount_code ? props.discount_code : '',
      wants_email: false,
      errors: []
    };
  }

  onValueChange(field: string, event: any) {
    // In a way this would be nicer to have in Store.jsx (Store is kind of
    // the 'controller'), but it's too slow updating the whole app with each keypress
    // Also, until the user clicks "Tallenna", no other part can need these values..
    // So at least for now, kepe these in this state and save them to the Order in
    // onSave().
    // This also allows validation here.
    if (field === 'wants_email') {
      this.setState({wants_email: event.target.checked});
    } else {
      var stateUpdate: IContactsState = {};
      stateUpdate[field] = event.target.value;
      this.setState(stateUpdate);
    }
  }

  onSave() {
    var errors: string[] = [];
    if (!this.state.name) {
      errors.push('name');
    }
    if (!isValidEmail(this.state.email.trim())) {
      errors.push('email');
    }
    if (this.state.discount_code && !this._checkDiscountCode(this.props.production_id, this.state.discount_code)) {
      errors.push('discount_code');
    }

    this.setState({errors: errors});
    if (errors.length === 0) {
      this.props.onSaveOrderInfo({
        name: this.state.name.trim(),
        email: this.state.email.trim(),
        discount_code: this.state.discount_code.trim(),
        wants_email: this.state.wants_email
      });
    }
  }

  private _checkDiscountCode(production_id: number, discount_code: string): boolean {
    var req = $.ajax({
      url: 'api/discountCode/' + production_id + '/' + discount_code,
      async: false
    });
    return JSON.parse(req.responseText).ok === true;
  }

  // tslint:disable-next-line: member-ordering
  render() {
    var active = this.props.active;
    var divClass = 'shopping-stage contact-input';
    if (!active) {
      divClass += ' disabled';
    }

    return (
      <div className={divClass}>
        <h2>Yhteystiedot <small>4/5</small></h2>
        <div>
          <Bootstrap.FormGroup
              validationState={ _.contains(this.state.errors, 'name') ? ('error') : null } >
            <Bootstrap.ControlLabel>Nimi</Bootstrap.ControlLabel>
            <Bootstrap.FormControl
                type='text'
                readOnly={!active}
                onChange={this.onValueChange.bind(this, 'name')}
                value={this.state.name} />
          </Bootstrap.FormGroup>
        </div>

        <div>
          <Bootstrap.FormGroup
              validationState={ _.contains(this.state.errors, 'email') ? ('error') : null } >
            <Bootstrap.ControlLabel>Sähköposti</Bootstrap.ControlLabel>
            <Bootstrap.FormControl
                type='text'
                readOnly={!active}
                onChange={this.onValueChange.bind(this, 'email')}
                value={this.state.email} />
          </Bootstrap.FormGroup>
        </div>

        <div>
          <Bootstrap.FormGroup
               validationState={ _.contains(this.state.errors, 'discount_code') ? ('error') : null } >
            <Bootstrap.ControlLabel>Alennuskoodi</Bootstrap.ControlLabel>
            <Bootstrap.FormControl
                type='text'
                readOnly={!active}
                onChange={this.onValueChange.bind(this, 'discount_code')}
                value={this.state.discount_code} />
          </Bootstrap.FormGroup>
        </div>
        <div>
          <Button id='saveOrderInfo' className='ok' disabled={!active} onClick={this.onSave.bind(this)}>Tallenna</Button>
          <Button className='cancel' disabled={!active} onClick={this.props.onCancel}>Peru</Button>
        </div>
      </div>
    );
  }
}
