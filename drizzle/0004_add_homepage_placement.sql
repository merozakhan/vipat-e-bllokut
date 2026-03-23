ALTER TABLE `articles` ADD COLUMN `homepagePlacement` enum('breaking','trending','hot','most_read') DEFAULT NULL;
ALTER TABLE `articles` ADD COLUMN `homepagePosition` int DEFAULT NULL;
