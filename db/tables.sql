SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
start transaction;

-- --------------------------------------------------------

drop table if exists nk2_discount_codes;
create table nk2_discount_codes (
  `code` varchar(32) not null,
  `eur` decimal(10,2) not null,
  `use_max` smallint(6) not null,
  `used` smallint(6) not null,
  `email` varchar(255) not null,
  `code_group` varchar(255) not null,
  PRIMARY KEY  (`code`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

drop table if exists nk2_discount_groups;
create table nk2_discount_groups (
  `id` smallint(6) not null auto_increment,
  `show_id` mediumint(9),
  `title` varchar(100) not null,
  `eur` decimal(10,2) not null,
  `admin_only` boolean not null,
  `active` boolean not null,
  PRIMARY KEY  (`id`),
  foreign key (show_id) references nk2_show(id)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

drop table if exists nk2_orders;
create table nk2_orders (
  `id` int(10) unsigned not null auto_increment,
  `name` varchar(255) not null,
  `email` varchar(255) not null,
  `discount_code` varchar(32) not null,
  `time` datetime not null,
  `price` decimal(10,2) not null,
  `payment_id` varchar(20) default NULL,
  PRIMARY KEY  (`id`),
  foreign key (discount_code) references nk2_discount_codes (code)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

drop table if exists nk2_seats;
create table nk2_seats (
  `id` int(11) not null auto_increment,
  `section_id` mediumint(9) not null,
  `seat_static_id` int(11) not null,
  `reserved_until` datetime,
  `reserved_session_id` varchar(32),
  `active` boolean not null default '1',
  PRIMARY KEY  (`id`),
  foreign key (section_id) references nk2_section (id),
  foreign key (seat_static_id) references nk2_seat_static (id)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

drop table if exists nk2_seats_static;
create table nk2_seats_static (
  `id` int(11) not null auto_increment,
  `section_static_id` smallint(6) not null,
  `row` smallint(6),
  `number` smallint(6),
  `x_coord` smallint(6),
  `y_coord` smallint(6),
  `bad_seat` boolean not null default '0',
  PRIMARY KEY  (`id`),
  foreign key (section_static_id) references nk2_sections_static (id)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

drop table if exists nk2_sections;
create table nk2_sections (
  `id` smallint(6) not null auto_increment,
  `section_static_id` smallint(6) not null,
  `show_id` smallint(6) not null,
  `price` decimal(10,2) not null,
  `active` boolean not null default '1',
  PRIMARY KEY  (`id`),
  foreign key (section_static_id) references nk2_sections_static (id),
  foreign key (show_id) references nk2_shows (id)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

drop table if exists nk2_sections_static;
create table nk2_sections_static (
  `id` int(10) unsigned not null auto_increment,
  `venue_id` smallint(6) not null,
  `title` varchar(255) not null,
  `row_name` varchar(20) not null,
  `sort` int(11) not null default '0',
  PRIMARY KEY  (`id`),
  foreign key (venue_id) references nk2_venues (id)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

drop table if exists nk2_shows;
create table nk2_shows (
  `id` int(10) unsigned not null auto_increment,
  `title` varchar(255) not null,
  `venue_id` smallint(6),
  `time` datetime not null,
  `active` boolean not null default '1',
  `inactivate_time` datetime not null,
  `description` mediumtext not null,
  PRIMARY KEY  (`id`),
  foreign key (venue_id) references nk2_venues (id)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

drop table if exists nk2_tickets;
create table nk2_tickets (
  `id` int(10) unsigned not null auto_increment,
  `order_id` int(11) unsigned not null,
  `show_id` int(11) unsigned not null,
  `seat_id` int(11) unsigned not null,
  `discount_group_id` smallint(6),
  `hash` varchar(32) not null,
  `price` decimal(10,2) not null,
  `used_time` datetime default NULL,
  PRIMARY KEY  (`id`),
  foreign key (order_id) references nk2_orders (id),
  foreign key (show_id) references nk2_shows (id),
  foreign key (seat_id) references nk2_seats (id),
  foreign key (discount_group_id) references nk2_discount_groups (id)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

drop table if exists nk2_venues;
create table nk2_venues (
  `id` smallint(6) not null auto_increment,
  `title` varchar(50) not null,
  `ticket_type` ENUM('numbered-seats', 'generic-tickets') not null,
  `description` varchar(255) not null,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

commit;
