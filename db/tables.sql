-- phpMyAdmin SQL Dump
-- version 3.2.2.1
-- http://www.phpmyadmin.net
--
-- Host: db.nodeta.fi
-- Generation Time: Aug 23, 2015 at 01:24 PM
-- Server version: 5.0.95
-- PHP Version: 5.2.17

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- Database: `speksi`
--

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_admin_menu`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_admin_menu` (
  `filename` varchar(40) character set latin1 NOT NULL,
  `act` varchar(40) character set latin1 default NULL,
  `userlevel` tinyint(4) NOT NULL,
  `menu_title` varchar(50) character set latin1 default NULL,
  `weight` tinyint(4) NOT NULL,
  KEY `act` (`act`),
  KEY `filename` (`filename`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_customers`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_customers` (
  `customer_id` smallint(6) NOT NULL auto_increment,
  `name` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `secret_key` varchar(255) NOT NULL,
  PRIMARY KEY  (`customer_id`),
  UNIQUE KEY `url` (`url`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=13 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_deliveries`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_deliveries` (
  `delivery_id` smallint(6) NOT NULL auto_increment,
  `title` varchar(50) NOT NULL,
  `price` float(3,2) NOT NULL,
  `customer_id` int(11) NOT NULL,
  PRIMARY KEY  (`delivery_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_deliveries_shows`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_deliveries_shows` (
  `delivery_id` smallint(6) NOT NULL,
  `show_id` smallint(6) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `inactivateTime` datetime NOT NULL,
  UNIQUE KEY `delivery_id` (`delivery_id`,`show_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_discountCodes`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_discountCodes` (
  `code` varchar(32) NOT NULL,
  `eur` float(6,2) NOT NULL,
  `useMax` smallint(6) NOT NULL,
  `used` smallint(6) NOT NULL,
  `email` varchar(255) NOT NULL,
  `codeGroup` varchar(255) NOT NULL,
  `customer_id` int(11) NOT NULL,
  PRIMARY KEY  (`code`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_discountGroups`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_discountGroups` (
  `discountGroup_id` smallint(6) NOT NULL auto_increment,
  `show_id` mediumint(9) NOT NULL,
  `name` varchar(100) NOT NULL,
  `eur` float(6,2) NOT NULL,
  `userlevel` smallint(6) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `customer_id` int(11) NOT NULL,
  PRIMARY KEY  (`discountGroup_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=41 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_email_list`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_email_list` (
  `order_id` int(11) NOT NULL,
  `register_list` tinyint(1) NOT NULL,
  PRIMARY KEY  (`order_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_errors`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_errors` (
  `error_key` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` varchar(255) NOT NULL,
  PRIMARY KEY  (`error_key`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Stand-in structure for view `lippukauppa_joined_tickets`
--
CREATE TABLE IF NOT EXISTS `lippukauppa_joined_tickets` (
`ticket_id` int(10) unsigned
,`order_id` int(10) unsigned
,`name` varchar(255)
,`email` varchar(255)
,`phone` varchar(50)
,`street_address` varchar(255)
,`post_no` varchar(10)
,`city` varchar(30)
,`delivery_id` smallint(6)
,`delivery_price` float(4,2)
,`refnumber` int(11) unsigned
,`discount_code` varchar(32)
,`discount_price` float(6,2)
,`time` datetime
,`price` float(6,2)
,`sponsor` smallint(6)
,`vm_pay_id` varchar(20)
,`delivered` tinyint(1)
,`ticket_background` varchar(63)
,`referer_id` int(11)
,`email_sent` tinyint(4)
,`show_name` varchar(255)
,`seat_id` int(11)
,`section_id` mediumint(9)
,`reserved` datetime
,`session_id` varchar(32)
,`boughtOrder_id` int(11)
,`active` tinyint(1)
,`discountGroup_name` varchar(100)
,`discountGroup_eur` float(6,2)
);
-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_log`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_log` (
  `log_id` int(10) unsigned NOT NULL auto_increment,
  `script_name` varchar(255) NOT NULL,
  `request_uri` varchar(255) NOT NULL,
  `post` text NOT NULL,
  `ip` varchar(15) NOT NULL,
  `session_id` char(32) NOT NULL,
  `session_data` text NOT NULL,
  `runtime` float(4,4) default NULL,
  `request_time` datetime NOT NULL,
  PRIMARY KEY  (`log_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=100 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_log_actions`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_log_actions` (
  `log_id` int(11) NOT NULL auto_increment,
  `message` text NOT NULL,
  `level` varchar(127) NOT NULL,
  `script_name` varchar(255) NOT NULL,
  `session_id` varchar(127) NOT NULL,
  `request_time` datetime NOT NULL,
  `user_id` smallint(6) NOT NULL,
  `show_id` mediumint(9) NOT NULL,
  `customer_id` smallint(6) NOT NULL,
  PRIMARY KEY  (`log_id`),
  KEY `session_id` (`session_id`,`show_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=279183 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_orders`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_orders` (
  `order_id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `street_address` varchar(255) NOT NULL,
  `post_no` varchar(10) NOT NULL,
  `city` varchar(30) NOT NULL,
  `delivery_id` smallint(6) NOT NULL,
  `delivery_price` float(4,2) NOT NULL,
  `refnumber` int(11) unsigned NOT NULL,
  `discount_code` varchar(32) NOT NULL,
  `discount_price` float(6,2) NOT NULL,
  `time` datetime NOT NULL,
  `price` float(6,2) NOT NULL COMMENT 'INCLUDES sponsor',
  `sponsor` smallint(6) NOT NULL,
  `vm_pay_id` varchar(20) default NULL,
  `delivered` tinyint(1) NOT NULL,
  `ticket_background` varchar(63) NOT NULL,
  `referer_id` int(11) NOT NULL,
  `email_sent` tinyint(4) NOT NULL,
  PRIMARY KEY  (`order_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5669 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_orders_cancelled`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_orders_cancelled` (
  `order_id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `street_address` varchar(255) NOT NULL,
  `post_no` varchar(10) NOT NULL,
  `city` varchar(30) NOT NULL,
  `delivery_id` smallint(6) NOT NULL,
  `delivery_price` float(4,2) NOT NULL,
  `refnumber` int(11) unsigned NOT NULL,
  `discount_code` varchar(32) NOT NULL,
  `discount_price` float(6,2) NOT NULL,
  `time` datetime NOT NULL,
  `price` float(6,2) NOT NULL COMMENT 'INCLUDES sponsor',
  `sponsor` smallint(6) NOT NULL,
  `vm_pay_id` varchar(20) default NULL,
  `delivered` tinyint(1) NOT NULL,
  `ticket_background` varchar(63) NOT NULL,
  `referer_id` int(11) NOT NULL,
  `email_sent` tinyint(4) NOT NULL,
  `cancelledTime` datetime NOT NULL,
  PRIMARY KEY  (`order_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5631 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_seats`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_seats` (
  `seat_id` int(11) NOT NULL auto_increment,
  `section_id` mediumint(9) NOT NULL,
  `seat_static_id` int(11) NOT NULL,
  `price` smallint(6) NOT NULL,
  `reserved` datetime NOT NULL,
  `session_id` varchar(32) NOT NULL,
  `boughtOrder_id` int(11) NOT NULL,
  `active` tinyint(1) NOT NULL default '1',
  PRIMARY KEY  (`seat_id`),
  KEY `seat_static_id` (`seat_static_id`),
  KEY `show_id` (`section_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=21384 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_seats_static`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_seats_static` (
  `seat_static_id` int(11) NOT NULL auto_increment,
  `venue_id` smallint(6) NOT NULL,
  `number` smallint(6) NOT NULL,
  `row` smallint(6) NOT NULL,
  `section_static_id` smallint(6) NOT NULL,
  `xCoord` smallint(6) NOT NULL,
  `yCoord` smallint(6) NOT NULL,
  `badSeat` tinyint(1) NOT NULL,
  PRIMARY KEY  (`seat_static_id`),
  KEY `section_id` (`section_static_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2868 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_sections`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_sections` (
  `section_id` smallint(6) NOT NULL auto_increment,
  `section_static_id` smallint(6) NOT NULL,
  `show_id` smallint(6) NOT NULL,
  `price` float(6,2) NOT NULL,
  `active` tinyint(1) NOT NULL,
  PRIMARY KEY  (`section_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=233 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_sections_static`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_sections_static` (
  `section_static_id` int(10) unsigned NOT NULL auto_increment,
  `venue_id` smallint(6) NOT NULL,
  `name` varchar(255) NOT NULL,
  `row_name` varchar(20) NOT NULL,
  `sort` int(11) NOT NULL default '0',
  PRIMARY KEY  (`section_static_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=16 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_settings`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_settings` (
  `setting_key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `title` varchar(100) NOT NULL,
  `userLevel` tinyint(4) NOT NULL,
  `global` tinyint(1) NOT NULL,
  `customer_id` int(11) NOT NULL,
  PRIMARY KEY  (`setting_key`,`customer_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_settings_structure`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_settings_structure` (
  `setting_key` varchar(100) NOT NULL,
  `default_value` text NOT NULL,
  `title` varchar(100) NOT NULL,
  `userLevel` tinyint(4) NOT NULL,
  `global` tinyint(1) NOT NULL,
  `weight` int(11) NOT NULL,
  PRIMARY KEY  (`setting_key`),
  KEY `global` (`global`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_shows`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_shows` (
  `show_id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(255) character set latin1 NOT NULL,
  `venue_id` smallint(6) NOT NULL,
  `external_store_description` mediumtext collate utf8_swedish_ci NOT NULL,
  `time` datetime NOT NULL,
  `active` tinyint(1) NOT NULL default '1',
  `inactivateTime` datetime NOT NULL,
  `description` mediumtext collate utf8_swedish_ci NOT NULL,
  `customer_id` int(11) NOT NULL,
  `url` varchar(255) collate utf8_swedish_ci NOT NULL,
  PRIMARY KEY  (`show_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci AUTO_INCREMENT=62 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_tickets`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_tickets` (
  `ticket_id` int(10) unsigned NOT NULL auto_increment,
  `order_id` int(11) unsigned NOT NULL,
  `show_id` int(11) unsigned NOT NULL,
  `seat_id` int(11) unsigned NOT NULL,
  `discountGroup_id` smallint(6) NOT NULL,
  `hash` varchar(32) NOT NULL,
  `used` tinyint(1) NOT NULL,
  `price` float(6,2) NOT NULL,
  `usedTime` datetime default NULL,
  PRIMARY KEY  (`ticket_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=15388 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_tickets_deleted`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_tickets_deleted` (
  `ticket_id` int(10) unsigned NOT NULL auto_increment,
  `order_id` int(11) unsigned NOT NULL,
  `show_id` int(11) unsigned NOT NULL,
  `seat_id` int(11) unsigned NOT NULL,
  `discountGroup_id` smallint(6) NOT NULL,
  `hash` varchar(32) NOT NULL,
  `used` tinyint(1) NOT NULL,
  `price` float(6,2) NOT NULL,
  `usedTime` datetime default NULL,
  `deletedTime` datetime NOT NULL,
  PRIMARY KEY  (`ticket_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=15306 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_userlevels`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_userlevels` (
  `userlevel` tinyint(4) NOT NULL auto_increment,
  `title` varchar(50) NOT NULL,
  PRIMARY KEY  (`userlevel`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=101 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_users`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_users` (
  `user_id` smallint(6) NOT NULL auto_increment,
  `username` varchar(50) NOT NULL,
  `passwd` varchar(40) NOT NULL,
  `userlevel` tinyint(4) NOT NULL,
  `customer_id` int(11) NOT NULL,
  PRIMARY KEY  (`user_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=20 ;

-- --------------------------------------------------------

--
-- Table structure for table `lippukauppa_venues`
--

CREATE TABLE IF NOT EXISTS `lippukauppa_venues` (
  `venue_id` smallint(6) NOT NULL auto_increment,
  `name` varchar(50) NOT NULL,
  `ticketType` tinyint(1) NOT NULL,
  `offset_x` smallint(6) NOT NULL,
  `offset_y` smallint(6) NOT NULL,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY  (`venue_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

-- --------------------------------------------------------

--
-- Structure for view `lippukauppa_joined_tickets`
--
DROP TABLE IF EXISTS `lippukauppa_joined_tickets`;

CREATE ALGORITHM=UNDEFINED DEFINER=`speksi`@`%` SQL SECURITY DEFINER VIEW `lippukauppa_joined_tickets` AS select `t`.`ticket_id` AS `ticket_id`,`o`.`order_id` AS `order_id`,`o`.`name` AS `name`,`o`.`email` AS `email`,`o`.`phone` AS `phone`,`o`.`street_address` AS `street_address`,`o`.`post_no` AS `post_no`,`o`.`city` AS `city`,`o`.`delivery_id` AS `delivery_id`,`o`.`delivery_price` AS `delivery_price`,`o`.`refnumber` AS `refnumber`,`o`.`discount_code` AS `discount_code`,`o`.`discount_price` AS `discount_price`,`o`.`time` AS `time`,`o`.`price` AS `price`,`o`.`sponsor` AS `sponsor`,`o`.`vm_pay_id` AS `vm_pay_id`,`o`.`delivered` AS `delivered`,`o`.`ticket_background` AS `ticket_background`,`o`.`referer_id` AS `referer_id`,`o`.`email_sent` AS `email_sent`,`sh`.`name` AS `show_name`,`s`.`seat_id` AS `seat_id`,`s`.`section_id` AS `section_id`,`s`.`reserved` AS `reserved`,`s`.`session_id` AS `session_id`,`s`.`boughtOrder_id` AS `boughtOrder_id`,`s`.`active` AS `active`,`dg`.`name` AS `discountGroup_name`,`dg`.`eur` AS `discountGroup_eur` from ((((`lippukauppa_tickets` `t` join `lippukauppa_orders` `o` on((`t`.`order_id` = `o`.`order_id`))) join `lippukauppa_shows` `sh` on((`t`.`show_id` = `sh`.`show_id`))) join `lippukauppa_seats` `s` on((`t`.`seat_id` = `s`.`seat_id`))) join `lippukauppa_discountGroups` `dg` on((`t`.`discountGroup_id` = `dg`.`discountGroup_id`)));
