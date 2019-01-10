'use strict';

import React = require('react');

export default class Footer extends React.Component<any, any> {
  render() {
    return (
      <div className='container'>
        <h2>Maksupalvelutarjoaja</h2>
        <p>Maksunvälityspalvelun toteuttajana ja maksupalveluntarjoajana toimii Checkout Finland Oy (2196606-6)
        yhteistyössä suomalaisten pankkien ja luottolaitosten kanssa. Checkout Finland Oy näkyy maksun saajana
        tiliotteella tai korttilaskulla ja välittää maksun kauppiaalle. Checkout Finland Oy:llä on maksulaitoksen
        toimilupa. Reklamaatiotapauksissa pyydämme ottamaan ensisijaisesti yhteyttä tuotteen toimittajaan.</p>
        <p>Checkout Finland Oy, y-tunnus: 2196606-6<br />
        Eteläpuisto 2 C<br />
        33200 Tampere<br />
        www.checkout.fi</p>
        <h2>Verkkopankit</h2>
        <p>Verkkopankkimaksamiseen liittyvän maksunvälityspalvelun toteuttaa Checkout Finland Oy (2196606-6)
        yhteistyössä suomalaisten pankkien ja luottolaitosten kanssa. Käyttäjän kannalta palvelu toimii
        aivan kuten perinteinen verkkomaksaminenkin.</p>
        /*<h2>Maksupalvelutarjoaja</h2>
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
        aivan kuten perinteinen verkkomaksaminenkin.</p>*/
      </div>
    );
  }
}
