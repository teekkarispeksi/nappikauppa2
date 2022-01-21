'use strict';

import React = require('react');

export default class Footer extends React.Component<any, any> {
  render() {
    return (
      <div className='container'>
        <h2>Toimitus- ja peruutusehdot</h2>
        <p>Liput tapahtumaan toimitetaan viivytyksettä asiakkaan antamaan sähköpostiosoitteeseen PDF-A muodossa maksutapahtuman vahvistamisen jälkeen.
          Mikäli toimituksessa on ongelmia, tarkistathan ensin roskapostilaatikon. Muussa tapauksessa ole yhteydessä sähköpostitse <a href="mailto:liput@teekkarispeksi.fi">liput@teekkarispeksi.fi</a>.
          Lipuilla ei ole peruutusoikeutta.
          Teekkarispeksi ry varaa oikeuden muutoksiin.
        </p>
        <h2>Yhteystiedot</h2>
        <p>Teekkarispeksi ry, y-tunnus: 1888541-7<br />
          <a href="liput@teekkarispeksi.fi">liput@teekkarispeksi.fi</a><br />
          PL69<br />
          02151 Espoo
        </p>
        <h2>Tietosuojaseloste</h2>
        <p>Lippukaupan tietosuojaseloste on saatavilla osoitteesta <a href="https://rekisterit.teekkarispeksi.fi/lippukauppa">rekisterit.teekkarispeksi.fi/lippukauppa</a></p>
        <h2>Maksupalvelutarjoaja</h2>
        <p>Maksunvälityspalvelun toteuttajana ja maksupalveluntarjoajana toimii Paytrail Oyj (2122839-7)
        yhteistyössä suomalaisten pankkien ja luottolaitosten kanssa. Paytrail Oyj näkyy maksun saajana
        tiliotteella tai korttilaskulla ja välittää maksun kauppiaalle. Paytrail Oyj:llä on maksulaitoksen
        toimilupa. Reklamaatiotapauksissa pyydämme ottamaan ensisijaisesti yhteyttä tuotteen toimittajaan.</p>
        <p>Paytrail Oyj, y-tunnus: 2122839-7<br />
        Innova 2<br />
        Lutakonaukio 7<br />
        40100 Jyväskylä<br />
        <a href="https://www.paytrail.com/kuluttaja/maksupalveluehdot">https://www.paytrail.com/kuluttaja/maksupalveluehdot</a></p>
      </div>
    );
  }
}
