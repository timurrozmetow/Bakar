-- Optional packshot per packaging option. Falls back to the product image.
--
-- Table name is `ProductVariant`, matching 0_init. Prisma's diff would emit
-- `productvariant` here: Windows MySQL folds identifiers to lower case, while
-- production runs Linux where they are case-sensitive.
--
-- VARCHAR, not TEXT: MySQL rejects DEFAULT on TEXT columns (error 1101).
ALTER TABLE `ProductVariant`
    ADD COLUMN `image` VARCHAR(191) NOT NULL DEFAULT '';
