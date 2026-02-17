CREATE TABLE `article_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`categoryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `article_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_article_category` UNIQUE(`articleId`,`categoryId`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`featuredImage` varchar(500),
	`featuredImageKey` varchar(500),
	`status` enum('draft','published') NOT NULL DEFAULT 'published',
	`authorId` int NOT NULL,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `article_idx` ON `article_categories` (`articleId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `article_categories` (`categoryId`);--> statement-breakpoint
CREATE INDEX `author_idx` ON `articles` (`authorId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `articles` (`status`);--> statement-breakpoint
CREATE INDEX `published_at_idx` ON `articles` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `articles` (`slug`);