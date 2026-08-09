CREATE TABLE `meal_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipeId` varchar(180) NOT NULL,
	`recipeName` varchar(140) NOT NULL,
	`recipeData` text NOT NULL,
	`servings` int NOT NULL,
	`rating` int,
	`notes` text,
	`cookedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meal_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `meal_logs` ADD CONSTRAINT `meal_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `meal_logs_user_cooked_idx` ON `meal_logs` (`userId`,`cookedAt`);--> statement-breakpoint
CREATE INDEX `meal_logs_user_recipe_idx` ON `meal_logs` (`userId`,`recipeId`);