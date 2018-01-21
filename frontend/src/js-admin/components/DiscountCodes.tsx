'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import Button from '../../js/components/Button';
import editable = require('./editables');
import {IDiscountCode} from '../../../../backend/src/discountCode';
import {IProduction} from '../../../../backend/src/production';


export interface IDiscountCodeProps {
  production_id?: number;
}

export interface IDiscountCodeState {
  originalDiscountCodes?: IDiscountCode[];
  discountCodes?: IDiscountCode[];
  newDiscountCodes?: IDiscountCode[];
  new_code_base?: string;
  new_code_eur?: number;
  new_code_group?: string;
  new_code_emails?: string[];
  new_code_use_max?: number;
  new_email_subject?: string;
  new_email_text?: string;
  production_id: number;
  productions: IProduction[];
}

// this is a 'hacky' way, but works for stuff that consists of objects, arrays, strings and numbers
function almostDeepClone<T extends {}>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default class DiscountCode extends React.Component<IDiscountCodeProps, IDiscountCodeState> {
  constructor(props) {
    super(props);
    var defaultEmailSubject = 'Alennuskoodisi Teekkarispeksin näytökseen';
    var defaultEmailText = 'Hei,\n\ntällä koodilla saat $EUR$ eur alennusta ostaessasi lipun osoitteessa $URL$\n\n$CODE$\n\nTervetuloa katsomaan esityksiämme!';
    this.state = {
      productions: null,
      production_id: props.production_id,
      originalDiscountCodes: [],
      discountCodes: null,
      newDiscountCodes: [],
      new_email_subject: defaultEmailSubject,
      new_email_text: defaultEmailText
    };
  }

  reset(discountCodes?: IDiscountCode[]) {
    var newState: IDiscountCodeState = {
      newDiscountCodes: [],
      new_code_base: null,
      new_code_eur: null,
      new_code_group: null,
      new_code_emails: [],
      new_code_use_max: 1,
      productions: this.state.productions,
      production_id: this.state.production_id
    };
    if (discountCodes) {
      newState.originalDiscountCodes = discountCodes;
      newState.discountCodes = almostDeepClone(discountCodes);
    } else {
      newState.discountCodes = almostDeepClone(this.state.originalDiscountCodes);
    }
    this.setState(newState);
  }

  componentWillMount() {
    $.getJSON('admin-api/discountCodes', (resp: IDiscountCode[]) => {
      this.reset(resp);
    });
    $.getJSON('admin-api/productions', (resp: IProduction[]) => {
      this.setState({productions: resp});
    });
    if (this.props.production_id == null) {
      $.getJSON('api/productions/latest', (resp: IProduction) => {
        this.setState({production_id: resp.id});
      });
    }
  }

  onProductionSelected(event/*: React.ChangeEvent<React.Component<Bootstrap.FormControlProps, {}>>*/) {
    this.setState({production_id: parseInt(event.target.value)});
  }

  saveChanges(newCodes = false, send = false) {

    /*changing email subject and text values on save and send for new codes*/
    if (newCodes && send) {
      this.setState( {newDiscountCodes: this.state.newDiscountCodes.map((item): IDiscountCode => {
        item.email_subject = this.state.new_email_subject;
        item.email_text = this.state.new_email_text;
        return item;
      })});
    }

    $.ajax({
      url: 'admin-api/discountCodes' + ((newCodes && send) ? '/send' : ''),
      method: 'POST',
      data: JSON.stringify(newCodes ? this.state.newDiscountCodes : this.state.discountCodes),
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
    var s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var randoms = this.state.new_code_emails.map(() => '_' + Array(6).join().split(',').map(() => s.charAt(Math.floor(Math.random() * s.length))).join(''));
    var newCodes = this.state.new_code_emails.map((email, i): IDiscountCode => {
      return {
        code: this.state.new_code_base + randoms[i],
        eur: this.state.new_code_eur,
        production_id: this.state.production_id,
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
    if (!this.state.discountCodes || !this.state.productions || this.state.production_id == null) {
      return (<div></div>);
    }
    var discountCodes = _.where(this.state.discountCodes, {production_id: this.state.production_id});

    var canGenerateCodes = this.state.production_id && this.state.new_code_base && this.state.new_code_base.length > 0 &&
      this.state.new_code_eur != null && this.state.new_code_group && this.state.new_code_group.length > 0 &&
      this.state.new_code_emails && this.state.new_code_emails.length > 0;

    var hasChanges = !_.isEqual(this.state.discountCodes, this.state.originalDiscountCodes);

    return (
      <div>
        <h2>Valitse produktio</h2>
        <Bootstrap.FormControl componentClass='select' onChange={this.onProductionSelected.bind(this)} value={this.state.production_id}>
          {this.state.productions.map((production) => {
            return (<option key={production.id} value={production.id}>{production.title} - {_.where(this.state.discountCodes, {production_id: production.id}).length}</option>);
          })}
        </Bootstrap.FormControl>
        <h2>Luo alennuskoodeja</h2>
        <Bootstrap.Table bordered>
          <tbody>
            <tr><td>Koodi</td><td>{editable.String(this, this.state, 'new_code_base')}</td></tr>
            <tr><td>Arvo (eur)</td><td>{editable.Number(this, this.state, 'new_code_eur')}</td></tr>
            <tr><td>Ryhmä</td><td>{editable.String(this, this.state, 'new_code_group')}</td></tr>
            <tr><td>Sähköpostit <br/><br/>(jokaiselle luodaan oma koodi muotoa <br/>{this.state.new_code_base}_XXXXXX)</td>
              <td>{editable.StringList(this, this.state, 'new_code_emails')}</td>
            </tr>
            <tr><td>Käyttökertoja</td><td>{editable.Number(this, this.state, 'new_code_use_max')}</td></tr>
          </tbody>
        </Bootstrap.Table>
        <Button onClick={this.generateNewCodes.bind(this)} disabled={!canGenerateCodes}>Generoi koodit</Button>
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
        <Button onClick={() => this.saveChanges(true, false)} disabled={this.state.newDiscountCodes.length === 0}>Tallenna koodit</Button>
        <span style={{marginLeft: '5px', marginRight: '5px'}}>tai</span>
        <Button onClick={() => this.saveChanges(true, true)} disabled={this.state.newDiscountCodes.length === 0}>Tallenna ja lähetä koodit</Button>
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
          {discountCodes.map((code) => {
            return (<tr key={code.code} className={code.used === code.use_max ? 'success' : ''}>
                <td>{code.code}</td>
                <td>{editable.Number(this, code, 'eur')}</td>
                <td>{editable.String(this, code, 'code_group')}</td>
                <td>{editable.String(this, code, 'email')}</td>
                <td>{editable.Number(this, code, 'use_max')}</td>
                <td>{code.used}</td>
              </tr>
            );
          })}
        </tbody></Bootstrap.Table>
        <Button onClick={() => this.saveChanges()} disabled={!hasChanges}>Tallenna muutokset</Button>
        <Button onClick={() => this.reset()} disabled={!hasChanges}>Peru</Button>
      </div>
    );
  }

}
