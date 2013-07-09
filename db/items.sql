DROP TABLE IF EXISTS `Items`;
CREATE TABLE `Items` (
	`item_id` INT(64) NOT NULL AUTO_INCREMENT,
	`channel_id` INT(64) NOT NULL,
	`title` VARCHAR(512) NOT NULL,
	`link` TEXT NOT NULL,
	`description` LONGTEXT NOT NULL,
	`guid` VARCHAR(512) NOT NULL,
	`hash` CHAR(64) NOT NULL UNIQUE,
	`published` DATETIME NOT NULL,
	`read` BOOLEAN NOT NULL DEFAULT 0,
	PRIMARY KEY (`item_id`),
	INDEX `channel_ind` (`channel_id`, `read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;