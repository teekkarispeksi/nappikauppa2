start transaction;

insert into nk2_discount_codes (code, eur, use_max, email, code_group) values
    ('TEST_123', '14', 1, 'foo@example.com', 'TEST'),
    ('admin-code', 99, 9999, 'pekko@example.com', 'ADMIN');

insert into nk2_shows (title, venue_id, time, active, inactivate_time, description) values
    ('Helsinki I (Ensi-ilta)',         2, '2023-03-16 19:00:00', true, '2023-03-15 21:00:00', '<p>Näytös järjestetään Aleksanterin teatterissa, Albertinkatu 32. Teatteri perii eteispalvelumaksun.\r\n\r\n<p>Lippuja saa ostaa teatterin ovelta tuntia ennen näytöstä, niin kauan kuin niitä on jäljellä.'),
    ('Helsinki II',                    2, '2023-03-17 19:00:00', true, '2023-03-17 12:00:00', '<p>Näytös järjestetään Aleksanterin teatterissa, Albertinkatu 32. Teatteri perii eteispalvelumaksun.\r\n\r\n<p>Lippuja saa ostaa teatterin ovelta tuntia ennen näytöstä, niin kauan kuin niitä on jäljellä.'),
    ('Helsinki III',                   2, '2023-03-23 19:00:00', true, '2023-03-23 12:00:00', '<p>Näytös järjestetään Aleksanterin teatterissa, Albertinkatu 32. Teatteri perii eteispalvelumaksun.'),
    ('Helsinki IV',                    2, '2023-03-24 19:00:00', true, '2023-03-24 12:00:00', '<p>Näytös järjestetään Aleksanterin teatterissa, Albertinkatu 32. Teatteri perii eteispalvelumaksun.'),
    ('Helsinki V (Alumninäytös)',      2, '2023-04-12 19:00:00', true, '2023-04-12 12:00:00', '<p>Alumninäytös on suunnattu erityisesti valmistuneille Teekkarispeksin ystäville, mutta myös opiskelijat ovat erittäin tervetulleita mukaan. Opiskelijahintaisia lippuja ei kuitenkaan valitettavasti ole saatavilla.\r\n\r\n<p>Näytös järjestetään Aleksanterin teatterissa, Albertinkatu 32. Teatteri perii eteispalvelumaksun.\r\n\r\n<p>Esitys kestää noin kolme tuntia väliajan kanssa.\r\n\r\n<div id="ad_alumni"><a href="https://alumninet.aalto.fi/Portal/Public/Default.aspx"><img src="/kauppa/custom/teekkarispeksi2015/img/alumninet_oranssi.png"></a></div>\r\n\r\n<style>#showinfo { display: none !important }</style>'),
    ('Helsinki VI',                    2, '2023-04-13 19:00:00', true, '2023-04-13 12:00:00', '<p>Näytös järjestetään Aleksanterin teatterissa, Albertinkatu 32. Teatteri perii eteispalvelumaksun.'),
    ('Helsinki VII',                   2, '2023-04-20 19:00:00', true, '2023-04-20 12:00:00', '<p>Näytös järjestetään Aleksanterin teatterissa, Albertinkatu 32. Teatteri perii eteispalvelumaksun.'),
    ('Helsinki VIII',                  2, '2023-04-21 19:00:00', true, '2023-04-21 12:00:00', '<p>Näytös järjestetään Aleksanterin teatterissa, Albertinkatu 32. Teatteri perii eteispalvelumaksun.'),
    ('Vaasa, kaupunginteatteri',       4, '2023-03-30 19:00:00', true, '2023-03-30 16:00:00', '<p>Näytös järjestetään Vaasan Kaupunginteatterin Romeo-salissa. Teatteri perii eteispalvelumaksun.'),
    ('Kuopio, kaupunginteatteri',      8, '2023-04-15 19:00:00', true, '2023-04-15 16:00:00', '<p>Näytös järjestetään Kuopion Kaupunginteatterin Maria-näyttämöllä, Niiralankatu 2.'),
    ('Tampere, Hällä-teatteri',        1, '2023-03-20 18:00:00', true, '2023-03-20 18:00:00', '<p>Teekkarispeksi esiintyy Tampereella 20. maaliskuuta Hällä-näyttämöllä. Esitys alkaa kello 18:00. Liput aikuisille <b>20€</b>, opiskelijoille <b>16€</b>.</p>\r\n\r\n<p>Tampereen näytöksen lipunmyynnistä vastaa NääsPeksi.</p>\r\n<p><a href=\\"http://naaspeksi.net/qsot-event/teekkarispeksi-2015-supernova/teekkarispeksi15/\\" style=\\"font-size: 20px;\\">Osta lippuja Tampereen näytökseen</a><p>'),
    ('Turku, Sigyn-sali',              7, '2023-04-01 18:00:00', true, '2023-04-01 15:00:00', '<p>Näytös järjestetään Sigyn-salissa, Linnankatu 60. Teatteri perii eteispalvelumaksun.'),
    ('Lappenrannan kaupunginteatteri', 5, '2023-04-02 18:00:00', true, '2023-04-01 15:00:00', '<p>xxx.'),
    ('Espoo, Louhisali',               6, '2023-04-03 18:00:00', true, '2023-04-01 15:00:00', '<p>xxx.'),
    ('Helsinki, Gloria',               3, '2023-04-04 18:00:00', true, '2023-04-01 15:00:00', '<p>xxx.');

insert into nk2_discount_groups (show_id, title, eur, admin_only, active) values
    (null, 'Normaalilippu', 0, false, true),
    (null, 'Opiskelija', 4, false, true),
    (null, 'Ilmaislippu', 999, true, true),
    (1, 'Erikoislippu', 2, false, true),
    (1, 'Eläkeläinen', 5, false, false);

insert into nk2_prices (show_id, section_id, price, active) values
    (1, 1, 18.00, true),
    (1, 2, 20.00, true),
    (1, 3, 18.00, true),
    (1, 4, 18.00, true),
    (1, 5, 18.00, true),
    (1, 6, 18.00, true),
    (1, 7, 14.00, true),
    (1, 8, 14.00, false),
    (1, 9, 14.00, true),
    (2, 1, 18.00, true),
    (2, 2, 20.00, true),
    (2, 3, 18.00, true),
    (2, 4, 18.00, true),
    (2, 5, 18.00, true),
    (2, 6, 18.00, true),
    (2, 7, 14.00, true),
    (2, 8, 14.00, true),
    (2, 9, 14.00, true),
    (3, 1, 18.00, true),
    (3, 2, 20.00, true),
    (3, 3, 18.00, true),
    (3, 4, 18.00, true),
    (3, 5, 18.00, true),
    (3, 6, 18.00, true),
    (3, 7, 14.00, true),
    (3, 8, 14.00, true),
    (3, 9, 14.00, true),
    (9, 11, 14.00, true),
    (10, 15, 14.00, true),
    (12, 14, 14.00, true),
    (13, 12, 14.00, true),
    (14, 13, 14.00, true),
    (15, 10, 14.00, true);

insert into nk2_orders (name, email, discount_code, time, price, payment_id, reserved_until, reserved_session_id, status) values
    ('Pekko I', 'pekko@example.com', null, '2015-03-13 12:47:05', 14.00, 'AASDASD', null, null, 'paid'),
    ('Sponsoroitu', 'bar@example.com', 'admin-code', '2015-03-15 13:39:22', 0.00, 'WOODOO', null, null, 'paid'),
    (null, null, null, '2015-03-15 13:39:22', null, null, '2017-01-01', 'xyz', 'seats-reserved');

insert into nk2_tickets (order_id, show_id, seat_id, discount_group_id, hash, price, used_time) values
    (1, 1, 2, 1, '0123456789', 18.00, null),
    (2, 1, 3, 2, 'abcdef', 14.00, null),
    (2, 1, 1, 4, 'free!', 0.00, null),
    (3, 2, 10, 1, 'unnumbered', 14.00, null);


commit;


-- to see joined data about ticekts:
select
    tickets.hash, tickets.price,
    orders.*,
    shows.title, shows.time,
    venues.title,
    seats.row, seats.number, seats.bad_seat,
    sections.title
from nk2_tickets tickets
    join nk2_orders orders on tickets.order_id = orders.id

    join nk2_shows shows on tickets.show_id = shows.id
    join nk2_venues venues on shows.venue_id = venues.id

    join nk2_seats seats on tickets.seat_id = seats.id
    join nk2_sections sections on seats.section_id = sections.id;
