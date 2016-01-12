'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import editable = require('./editables.tsx');
import {IDiscountCode} from '../../../../backend/src/discountCode';


export interface IDiscountCodeProps {
}

export interface IDiscountCodeState {
  discountCodes?: IDiscountCode[];
  newDiscountCodes?: IDiscountCode[];
  new_code_base?: string;
  new_code_eur?: number;
  new_code_group?: string;
  new_code_emails?: string[];
  new_code_use_max?: number;
  new_email_subject?: string;
  new_email_text?: string;
}

export default class DiscountCode extends React.Component<IDiscountCodeProps, IDiscountCodeState> {
  constructor() {
    super();
    var defaultEmailSubject = 'Alennuskoodisi Teekkarispeksin näytökseen';
    var defaultEmailText = 'Hei,\n\ntällä koodilla saat $EUR$ eur alennusta ostaessasi lipun osoitteessa $URL$:\n\n$CODE$\n\nTervetuloa katsomaan esityksiämme!';
    this.state = {discountCodes: null, newDiscountCodes: [], new_email_subject: defaultEmailSubject, new_email_text: defaultEmailText};
  }

  reset(discountCodes?: IDiscountCode[]) {
    if (discountCodes) {
      this.setState({discountCodes: discountCodes});
    }
    this.setState({
      newDiscountCodes: [],
      new_code_base: null,
      new_code_eur: null,
      new_code_group: null,
      new_code_emails: [],
      new_code_use_max: 1
    });
  }

  componentWillMount() {
    $.getJSON('admin-api/discountCodes', (resp: IDiscountCode[]) => {
      this.reset(resp);
    });
  }

  createCodes(send: boolean) {
    $.ajax({
      url: 'admin-api/discountCodes' + (send ? '/send' : ''),
      method: 'POST',
      data: JSON.stringify(this.state.newDiscountCodes),
      contentType: 'application/json',
      success: (response: IDiscountCode[]) => {
        this.reset(response);
      },
      error: (response) => {
        console.log('discountCode creation failed'); // TODO
      }
    });
  }

  generateNewCodes() {
    var randoms = [''];
    if (this.state.new_code_emails.length > 1) {
      var s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      randoms = this.state.new_code_emails.map(() => '_' + Array(6).join().split(',').map(function() { return s.charAt(Math.floor(Math.random() * s.length)); }).join(''));
    }
    var newCodes = this.state.new_code_emails.map((email, i): IDiscountCode => {
      return {
        code: this.state.new_code_base + randoms[i],
        eur: this.state.new_code_eur,
        code_group: this.state.new_code_group,
        email: email,
        use_max: this.state.new_code_use_max,
        email_subject: this.state.new_email_subject,
        email_text: this.state.new_email_text
      };
    });
    this.setState({newDiscountCodes: newCodes});
  }

  render() {
    if (!this.state.discountCodes) {
      return (<div></div>);
    }
    var discountCodes = this.state.discountCodes;

    var canGenerateCodes = this.state.new_code_base && this.state.new_code_base.length > 0 &&
      this.state.new_code_eur != null && this.state.new_code_group && this.state.new_code_group.length > 0 &&
      this.state.new_code_emails && this.state.new_code_emails.length > 0;

    return (
      <div>
        <h2>Luo alennuskoodeja</h2>
        <Bootstrap.Table bordered>
          <tbody>
            <tr><td>Koodi</td><td>{editable.String(this, this.state, 'new_code_base')}</td></tr>
            <tr><td>Arvo (eur)</td><td>{editable.Number(this, this.state, 'new_code_eur')}</td></tr>
            <tr><td>Ryhmä</td><td>{editable.String(this, this.state, 'new_code_group')}</td></tr>
            <tr><td>Sähköpostit <br/>(jos osoitteita on enemmän kuin yksi,<br/> jokaiselle luodaan oma koodi muotoa <br/>{this.state.new_code_base}_XXXXXX)</td>
              <td>{editable.StringList(this, this.state, 'new_code_emails')}</td>
            </tr>
            <tr><td>Käyttökertoja</td><td>{editable.Number(this, this.state, 'new_code_use_max')}</td></tr>
          </tbody>
        </Bootstrap.Table>
        <Bootstrap.Button onClick={this.generateNewCodes.bind(this)} disabled={!canGenerateCodes}>Generoi koodit</Bootstrap.Button>
        <h2>Uudet alennuskoodit</h2>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>Koodi</th>
            <th>Arvo</th>
            <th>Ryhmä</th>
            <th>Email</th>
            <th>Käyttökertoja alunperin</th>
          </tr></thead>
          <tbody>
          {this.state.newDiscountCodes.map((code) => {
            return (<tr key={code.code}>
                <td>{code.code}</td>
                <td>{code.eur}</td>
                <td>{code.code_group}</td>
                <td>{code.email}</td>
                <td>{code.use_max}</td>
              </tr>
            );
          })}
        </tbody></Bootstrap.Table>
        <Bootstrap.Table bordered>
          <tbody>
            <tr><td>Viestin otsikko</td><td>{editable.String(this, this.state, 'new_email_subject')}</td></tr>
            <tr><td>Viestin teksti<br/><br/>$CODE$ korvataan alennuskoodilla,<br/>$EUR$ koodin arvolla ja<br/>$URL$ lippukaupan osoitteella.</td>
              <td>{editable.Text(this, this.state, 'new_email_text')}</td></tr>
          </tbody>
        </Bootstrap.Table>
        <Bootstrap.Button onClick={this.createCodes.bind(this, false)} disabled={this.state.newDiscountCodes.length === 0}>Tallenna koodit</Bootstrap.Button>
        <span style={{marginLeft: '5px', marginRight: '5px'}}>tai</span>
        <Bootstrap.Button onClick={this.createCodes.bind(this, true)} disabled={this.state.newDiscountCodes.length === 0}>Tallenna ja lähetä koodit</Bootstrap.Button>
        <h2>Alennuskoodit</h2>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>Koodi</th>
            <th>Arvo</th>
            <th>Ryhmä</th>
            <th>Email</th>
            <th>Käyttökertoja alunperin</th>
            <th>Koodi käytetty</th>
          </tr></thead>
          <tbody>
          {this.state.discountCodes.map((code) => {
            return (<tr key={code.code}>
                <td>{code.code}</td>
                <td>{code.eur}</td>
                <td>{code.code_group}</td>
                <td>{code.email}</td>
                <td>{code.use_max}</td>
                <td>{code.used}</td>
              </tr>
            );
          })}
        </tbody></Bootstrap.Table>
      </div>
    );
  }

}
