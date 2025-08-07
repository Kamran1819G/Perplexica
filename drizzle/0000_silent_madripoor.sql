CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`createdAt` text NOT NULL,
	`files` text DEFAULT '[]'
);
--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `chats` (`createdAt`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`chatId` text NOT NULL,
	`messageId` text NOT NULL,
	`type` text,
	`metadata` text
);
--> statement-breakpoint
CREATE INDEX `chat_id_idx` ON `messages` (`chatId`);--> statement-breakpoint
CREATE INDEX `message_id_idx` ON `messages` (`messageId`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `messages` (`type`);--> statement-breakpoint
CREATE INDEX `chat_role_idx` ON `messages` (`chatId`,`type`);