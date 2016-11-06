'use strict';

import React = require('react');

export default class Footer extends React.Component<any, any> {
  render() {
    return (
      <div className='container'>
        <h2>Maksupalvelutarjoaja</h2>
        <p>Maksunvälityspalvelun toteuttajana ja maksupalveluntarjoajana toimii Paytrail Oyj (2122839-7)
        yhteistyössä suomalaisten pankkien ja luottolaitosten kanssa. Paytrail Oyj näkyy maksun saajana
        tiliotteella tai korttilaskulla ja välittää maksun kauppiaalle. Paytrail Oyj:llä on maksulaitoksen
        toimilupa. Reklamaatiotapauksissa pyydämme ottamaan ensisijaisesti yhteyttä tuotteen toimittajaan.</p>
        <p>Paytrail Oyj, y-tunnus: 2122839-7<br />
        Innova 2<br />
        Lutakonaukio 7<br />
        40100 Jyväskylä<br />
        Puhelin: 0207 181830<br />
        www.paytrail.com</p>
        <h2>Verkkopankit</h2>
        <p>Verkkopankkimaksamiseen liittyvän maksunvälityspalvelun toteuttaa Paytrail Oyj (2122839-7)
        yhteistyössä suomalaisten pankkien ja luottolaitosten kanssa. Käyttäjän kannalta palvelu toimii
        aivan kuten perinteinen verkkomaksaminenkin.</p>
      </div>
    );
  }
}