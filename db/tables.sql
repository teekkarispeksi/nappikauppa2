SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
start transaction;

drop table if exists
  nk2_tickets,
  nk2_orders,
  nk2_prices,
  nk2_discount_codes,
  nk2_discount_groups,
  nk2_shows,
  nk2_productions;

drop table if exists
  nk2_seats,
  nk2_sections,
  nk2_venues;

-- ----------------------------------------------------------

create table nk2_venues (
  `id` smallint(6) not null auto_increment,
  `title` varchar(50) not null,
  `ticket_type` ENUM('numbered-seats', 'generic-tickets') not null,
  `description` varchar(255) not null,
  `layout_src` varchar(50),
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- ----------------------------------------------------------

create table nk2_sections (
  `id` int(10) unsigned not null auto_increment,
  `venue_id` smallint(6) not null,
  `title` varchar(255) not null,
  `row_name` varchar(20) not null,
  PRIMARY KEY  (`id`),
  foreign key (venue_id) references nk2_venues (id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

create table nk2_seats (
  `id` int(10) unsigned not null auto_increment,
  `section_id` int(10) unsigned not null,
  `row` smallint(6),
  `number` smallint(6),
  `x_coord` smallint(6),
  `y_coord` smallint(6),
  `inactive` boolean not null default '0',
  PRIMARY KEY  (`id`),
  foreign key (section_id) references nk2_sections (id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

create table nk2_discount_codes (
  `code` varchar(32) not null,
  `eur` decimal(10,2) not null,
  `use_max` smallint(6) not null,
  `email` varchar(255) not null,
  `code_group` varchar(255) not null,
  PRIMARY KEY  (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

create table nk2_productions (
  `id` int(10) unsigned not null auto_increment,
  `title` varchar(255) not null,
  `performer` varchar(255) not null,
  `opens` datetime not null,
  `active` boolean not null default '1',
  `description` mediumtext not null,
  `ticket_image_src` varchar(50) not null,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

create table nk2_shows (
  `id` int(10) unsigned not null auto_increment,
  `title` varchar(255) not null,
  `production_id` int(10) unsigned not null,
  `venue_id` smallint(6),
  `time` datetime not null,
  `active` boolean not null default '1',
  `inactivate_time` datetime not null,
  `description` mediumtext not null,
  PRIMARY KEY  (`id`),
  foreign key (production_id) references nk2_productions (id),
  foreign key (venue_id) references nk2_venues (id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

create table nk2_discount_groups (
  `id` smallint(6) unsigned not null auto_increment,
  `show_id` int(10) unsigned,
  `title` varchar(100) not null,
  `eur` decimal(10,2) not null,
  `admin_only` boolean not null,
  `active` boolean not null,
  PRIMARY KEY  (`id`),
  foreign key (show_id) references nk2_shows(id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

insert into nk2_discount_groups (id, show_id, title, eur, admin_only, active) values
    (1, null, 'Normaalilippu', 0, false, true),
    (2, null, 'Opiskelija', 0, false, true),
    (3, null, 'Ilmaislippu', 999, true, true),
    (9, null, 'Ryhmätilauslippu', 999, true, true);
-- our code expects that these exists
-- --------------------------------------------------------

create table nk2_orders (
  `id` int(10) unsigned not null auto_increment,
  `name` varchar(255) default null,
  `email` varchar(255) default null,
  `discount_code` varchar(32) default null,
  `wants_email` boolean default null,
  `time` datetime default null,
  `price` decimal(10,2) default null,
  `payment_url` varchar(200) default null,
  `payment_id` varchar(20) default NULL,
  `reserved_until` datetime, -- TODO remove as not used
  `reserved_session_id` varchar(32), -- TODO remove as not used
  `status` ENUM('seats-reserved', 'payment-pending', 'paid', 'cancelled', 'expired') not null,
  `hash` varchar(36) not null,
  PRIMARY KEY  (`id`),
  foreign key (discount_code) references nk2_discount_codes (code)
  on delete cascade
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;



create table nk2_prices (
  `id` smallint(6) not null auto_increment,
  `section_id` int(10) unsigned not null,
  `show_id` int(10) unsigned not null,
  `price` decimal(10,2) not null,
  `active` boolean not null default '1',
  PRIMARY KEY  (`id`),
  unique key section_in_show (show_id, section_id),
  foreign key (section_id) references nk2_sections (id),
  foreign key (show_id) references nk2_shows (id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

create table nk2_tickets (
  `id` int(10) unsigned not null auto_increment,
  `order_id` int(10) unsigned not null,
  `show_id` int(10) unsigned not null,
  `seat_id` int(10) unsigned,
  `discount_group_id` smallint(6) unsigned not null,
  `hash` varchar(36) not null,
  `price` decimal(10,2) not null,
  `used_time` datetime default NULL,
  PRIMARY KEY  (`id`),
  unique key seat_in_show (show_id, seat_id),
  foreign key (order_id) references nk2_orders (id) on delete cascade,
  foreign key (show_id) references nk2_shows (id),
  foreign key (seat_id) references nk2_seats (id),
  foreign key (discount_group_id) references nk2_discount_groups (id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;


commit;
