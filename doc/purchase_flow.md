NAPPIKAUPPA 2: Purchase flow
============================

0. Aloitus
----------

- GET /shows/
- Asiakas näkee myynnissä olevat näytökset ja niiden tiedot, mm. päivämäärä, täyttöaste
- Tämä voidaan myös renderöidä valmiiksi back-endissä, jotta ei ole latenssia ekalla latauksella
- Mahdollinen response:

```
{
    shows: [
        {
            id: 1,
            date: '2015-03-01 19:00',
            availablePercent: 0.97,
            status: 'ON_SALE', # not sure if needed - the logic can be in front-end too. Could include e.g. INACTIVE, SOLD_OUT, AT_DOORS_ONLY
            title: 'Enskari',
            location: 'Aleksanterin teatteri, Helsinki'
        },
        { 
            ...
        }
    ]
}
```

1. Lippujen valinta
-------------------

- GET /shows/<id>
    - onkohan meillä ikinä tilannetta, missä halutaan tietyn shown perustiedot mutta ei raskasta paikkainformaatiota
- Kaksi vaihtoehtoa: paikkaliput tai tavalliset
- Mahdollinen response, paikkaliput:

```
{
    id: 1,
    title: 'Enskari',
    location: 'Aleksanterin teatteri, Helsinki',
    description: 'Teatteri haluaa narikkamaksun, tule ajoissa paikalle',
    seat_type: 'NUMBERED', # or a boolean flag?
    seats: [
        {
            id: 101,
            status: 'AVAILABLE', # e.g. RESERVED, MY_RESERVED, BOOKED, INACTIVE
            x_coord: 150,
            y_coord: 14,
            row: 2,
            number: 14, # human-readable seat number
            prices: [14, 18], # loop through discount groups - could also do [{ discount_group: 'student', price: 14}, {discount_group: null, price: 18}], but it might bee to verbose
            section: 'Permanto'
        }
    ]
}
```

Mahdollista myös, ehkä jopa parempi:

```
{ 
    id ..
    sections: [
        {
            title: 'Permanto',
            seats: [ ... ]
        }
    ]
}
```

Tavalliset liput:

```
{
    id: ...,
    sections: [
        {
            title: 'Permanto',
            prices: [...]
        }
    ]
}
```

2. Valitse paikat
-----------------

- POST tai PUT /reserveSeat/<id>, vastauksena kaikki tämän hetken varaukset
- jokainen varaus-sessio tarvitsee jonkin id:n (satunnainen, ei lineaarinen), että tiedetään mille varaukselle paikat kohdistetaan. Voidaan lähettää urlissa tai cookiena
- tarvitaan myös DELETE-endpoint, ehkä myös aleryhmän vaihtamiselle erillinen (tai mennään samalla kuin uusi paikka)
- nykyään tieto siitä, oliko joku muu varannut paikan vai ei, tsekataan kun varausta muutetaan (uusi paikka, poista paikka). Supercool - mutta ei tarpeen just nyt - jos tapahtuisi livenä (websockets)!
    -> jos mennään nykysysteemillä, niin näillä pyynnöillä pitää siis saada takaisin myös koko kyseisen näytöksen paikkadata

```
{
    seats: [ ... ], # to see the current status of seats in the show - possible structure also with sections as noted in #1
    my_seats: [
        {
            show_id: 1, # currently we can support only one show at the same time, but I'd like to include possibility for multiple shows
            seat_id: 1337, # internal id
            row: 2,
            number: 14, # human-readable seat number
            section_title: 'Permanto',
            discount_group: 'Student',
            price: 14, # maybe unnecessary but might make this cleaner
            available_discount_groups: [
                { title: null, price: 18 },
                { title: 'Student', price: 14},
                { title: 'Admin VIP', price: 0}
            ]
        },
        ...
    ]
}
```

3. Vahvista varaus
------------------

- tämä starttaa timerin, x minuuttia aikaa mennä maksamaan (esim. 15min)
- timerin totuus on back-endissa. Joko pingataan 10-30 sek välein ja päivitetään laskuri, tai käytetään jotain cooleja websocketeja
- Joka pyynnöllä tästä eteenpäin varmistetaan, että paikat on edelleen varattuna, die jos on vanhentunut
- käytännössä esim. tyhjä request /confirmReservation, palauttaa saman kuin edellisen vaihe, front tarkistaa että yhtenevät?

4. Yhteystiedot
---------------

- super-simple form, nimi, email
- aiemmin ollut toimitusvaihtoehdot email/kirje, mutta heitetään se kirje nyt helvettiin, turhaa vaivaa
- alekoodit tässä kohtaa
- response vikaa vaihetta varten:

```
{
    status: 'OK', # or ERROR (e.g. invalid discount code)
    error: null,
    payment_rows: [
        { title: 'Pääsyliput 3 kpl', price: 42 },
        { title: 'Alennuskoodi FOOBAR', price: -12}
    ],
    total_price: 30 # looks redundant..
}
```

5. Maksamaan
------------

- Näytä vielä loppusumma edellisen vaiheen perusteella ja maksa-linkki
- Käytetään Verkkomaksuja, niillä on uudempi versio APIsta kuin meillä nyt käytössä, pitää tutustua miten se tarkalleen toimii, todnäk hyvin helppo
- Huom - merkitään myös meille, että on mennyt maksamaan
- Timer täytyy pysäyttää, muuten voi käydä niin, että rahat tulee mutta paikat meni tuplana
    - Nykyinen ongelma: mitä jos meni maksamaan, mutta sulki tabin verkkopankissa? Me ei saada tietoa!
    - Nykyinen ratkaisu: poistetaan käsin x päivän kuluttua, kun ollaan varmoja että maksu ei voi viipyä niin kauaa
    - Mahdollinen ratkaisu: lähetä sähköpostia hetken jälkeen, että me ei tiedetä mitä kävi, paina tästä jatkaaksesi maksua tai tästä peruaksesi tilauksen - jos ei tee mitään, niin poistetaan jälleen x päivän kuluttua
    - tässä edelleen riski, että maksu olikin ok, mutta perui silti itse varauksen, tai maksoi tuplana... User error on vaikea!


6. All done
-----------

- Saadaan jonkunlainen redirect Verkkomaksuilta, josta voidaan varmistaa, että maksu ok
- Lähetetään liput sähköpostilla
- JA tarjotaan mahdollisuus tulostaa ne saman tien
