CREATE TABLE IF NOT EXISTS `page_views` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `path` varchar(500) NOT NULL,
  `date` varchar(10) NOT NULL,
  `count` int NOT NULL DEFAULT 0,
  UNIQUE KEY `unique_path_date` (`path`, `date`),
  KEY `date_idx` (`date`)
);
