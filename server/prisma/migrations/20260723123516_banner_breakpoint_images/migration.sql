-- Art-directed banner artwork: one file per breakpoint, each optional and
-- falling back to `image`.
--
-- Table name is `Banner`, matching 0_init. Prisma's own diff emitted `banner`
-- here because Windows MySQL folds identifiers to lower case; production runs
-- Linux, where identifiers are case-sensitive and the lower-case form would
-- fail with "table doesn't exist".
--
-- VARCHAR, not TEXT: MySQL rejects DEFAULT on TEXT columns (error 1101).
ALTER TABLE `Banner`
    ADD COLUMN `imageSm` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `imageMd` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `imageLg` VARCHAR(191) NOT NULL DEFAULT '';
