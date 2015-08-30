start transaction;

insert into nk2_discount_codes (code, eur, use_max, email, code_group) values
    ('TEST_123', '14', 1, 'foo@example.com', 'TEST'),
    ('admin-code', 99, 0, 'pekko@example.com', 'ADMIN');

insert into nk2_discount_groups (show_id, title, eur, admin_only, active) values
    (null, 'Opiskelija', 4, false, true),
    (null, 'Ilmaislippu', 999, true, true),
    (1, 'Erikoislippu', 2, false, true),
    (1, 'Eläkeläinen', 5, false, false);

insert into nk2_venues (title, ticket_type, description) values
    ('Aleksanterin teatteri', 'numbered-seats', 'Bulevardi xx, Helsinki\nRatikat y,z'),
    ('Sigyn-sali', 'generic', 'xxkatu yy, Turku');

insert into nk2_sections (venue_id, title, row_name, seat_count) values
    (1, 'Permanto, parhaat paikat', 'riiv', null),
    (1, 'Permanto', 'rivi', null),
    (1, '1. parvi', 'rivi', null),
    (1, 'Aitiot, 1.parvi', 'aitio', null),

    (2, 'Permanto', 'riiv', 200);

insert into nk2_seats (section_id, row, number, x_coord, y_coord, bad_seat) values
    (1, 1, 1, 10, 10, false),
    (1, 1, 3, 30, 10, false),
    (2, 1, 2, 20, 10, false),
    (3, 5, 78, 40, 150, true),
    (4, 5, 2, 100, 80, false);

insert into nk2_shows (title, venue_id, time, active, inactivate_time, description) values
    ('Ensi-ilta', 1, '2016-04-19 19:00:00', true, '2016-04-18 12:00:00', 'Hyviä paikkoja\ntule ajoissa paikalle\n<b>tarvitaan html-tuki</b>'),
    ('Turku', 2, '2016-04-21 19:00:00', true, '2016-04-20 12:00:00', 'Lorem ipsum');

insert into nk2_prices (section_id, show_id, price, active) values
    (1, 1, 20.00, true),
    (2, 1, 18.00, true),
    (3, 1, 14.00, true),
    (4, 1, 14.00, false),

    (5, 2, 14.00, true);

insert into nk2_orders (name, email, discount_code, time, price, payment_id, reserved_until, reserved_session_id) values
    ('Pekko I', 'pekko@example.com', null, '2015-03-13 12:47:05', 14.00, 'AASDASD', null, null),
    ('Sponsoroitu', 'bar@example.com', 'admin-code', '2015-03-15 13:39:22', 0.00, 'WOODOO', null, null),
    (null, null, null, '2015-03-15 13:39:22', null, null, '2017-01-01', 'xyz');

insert into nk2_tickets (order_id, show_id, seat_id, section_id, discount_group_id, hash, price, used_time) values
    (1, 1, 2, null, null, '0123456789', 18.00, null),
    (2, 1, 3, null, null, 'abcdef', 14.00, null),
    (2, 1, 1, null, 2, 'free!', 0.00, null),
    (3, 2, null, 5, null, 'unnumbered', 14.00, null);


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
    join nk2_sections sections on seats.section_id = sections.id
