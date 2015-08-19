-- CREATE TABLE from live, modifications with ALTER TABLE's

drop table if exists lippukauppa_shows, nk2_shows;
CREATE TABLE `lippukauppa_shows` (
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
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

alter table lippukauppa_shows rename nk2_shows;
alter table nk2_shows change column show_id id int;
alter table nk2_shows change column name title varchar(255);
