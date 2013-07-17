DROP TABLE IF EXISTS `Channels`;
CREATE TABLE `Channels` (
	`channel_id` INT(64) NOT NULL AUTO_INCREMENT,
	`group_id` INT(64) NOT NULL DEFAULT 1,
	`title` VARCHAR(512) NOT NULL,
	`description` VARCHAR(512) NOT NULL,
	`ttl` INT(32) NOT NULL,
	`url` TEXT NOT NULL,
	`link` VARCHAR(128) NOT NULL,
	`last_update` TIMESTAMP NOT NULL,
	PRIMARY KEY (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;