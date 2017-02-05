ALTER TABLE nk2_discount_codes ADD production_id int(10) unsigned not null;
UPDATE nk2_discount_codes set production_id = (select min(id) from nk2_productions);
ALTER TABLE nk2_discount_codes ADD foreign key (production_id) references nk2_productions (id);
