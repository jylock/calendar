create database calendar;

use calendar;

create table user(
	user_id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT, 
	username VARCHAR(20) NOT NULL, 
	password VARCHAR(40) NOT NULL,
	name VARCHAR(20) NOT NULL,  
	email VARCHAR(30) NOT NULL, 
	PRIMARY KEY (user_id), 
	UNIQUE KEY (username) 
) ENGINE = INNODB DEFAULT character SET = UTF8 COLLATE = UTF8_GENERAL_CI;

create table event(
	event_id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
	user_id MEDIUMINT UNSIGNED NOT NULL,
	event_title VARCHAR(30) NOT NULL,
	event_date DATE NOT NULL,
 	event_time TIME NOT NULL,	
 	event_tag ENUM('danger','warning','info','success','primary'),
 	event_note TEXT,
 	primary key(event_id),
 	foreign key(user_id) references user(user_id)
)engine = INNODB DEFAULT character SET = utf8 COLLATE = utf8_general_ci;