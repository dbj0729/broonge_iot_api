-- MySQL Script generated by MySQL Workbench
-- Mon Dec  5 10:28:23 2022
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema broonge
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema broonge
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `broonge` DEFAULT CHARACTER SET utf8 ;
USE `broonge` ;

-- -----------------------------------------------------
-- Table `broonge`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(45) NOT NULL,
  `mobile` VARCHAR(45) NOT NULL,
  `reg_date` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`riding_data`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`riding_data` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_admin_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `bike_id` VARCHAR(45) NULL,
  `parked_image` VARCHAR(45) NULL,
  `is_locked` VARCHAR(45) NULL,
  `reg_date` VARCHAR(45) NULL,
  `update_date` VARCHAR(45) NULL,
  `gps_tracking_id` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`payment_history`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`payment_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `riding_data_id` VARCHAR(45) NOT NULL,
  `amount` VARCHAR(45) NOT NULL,
  `coupon_id` VARCHAR(45) NULL,
  `payment_status` VARCHAR(45) NOT NULL DEFAULT 'not_paid' COMMENT '결제가 완료 되었는지 여부 확인하기 : paid / not_paid / partially_paid / canceled / partially_canceled (결제완료 / 결제미완료 / 부분결제 / 결제취소 / 결제부분취소)',
  `payment_method` VARCHAR(45) NOT NULL COMMENT 'card_only / card_with_coupon / coupon_only',
  `card_company` VARCHAR(45) NOT NULL,
  `card_trx_serial_number` VARCHAR(45) NOT NULL,
  `reg_date` VARCHAR(45) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `card_trx_serial_number_UNIQUE` (`card_trx_serial_number` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`info_coupons`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`info_coupons` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(45) NOT NULL COMMENT 'amount / discount ',
  `coupon_name` VARCHAR(45) NOT NULL,
  `issue_cause` VARCHAR(45) NOT NULL,
  `is_active` VARCHAR(45) NOT NULL,
  `amount` VARCHAR(45) NULL,
  `discount_rate` VARCHAR(45) NULL,
  `basic_duration` VARCHAR(45) NOT NULL COMMENT 'Days\n',
  `reg_date` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`users_cards`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`users_cards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(45) NOT NULL,
  `card_company` VARCHAR(45) NOT NULL,
  `card_number` VARCHAR(45) NOT NULL,
  `card_holder` VARCHAR(45) NOT NULL,
  `card_password` VARCHAR(45) NOT NULL,
  `reg_date` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`bikes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`bikes` (
  `id` VARCHAR(255) NOT NULL,
  `owner_user_admin_id` VARCHAR(45) NOT NULL,
  `operated_on_date` DATETIME NULL,
  `issued_person_user_admin_id` VARCHAR(45) NULL,
  `history` LONGTEXT NULL,
  `is_active` VARCHAR(45) NULL,
  `reg_date` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`gps_tracking`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`gps_tracking` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `bike_id` INT NOT NULL,
  `coordinates` MEDIUMTEXT NOT NULL,
  `riding_data_id` INT NULL COMMENT '자전거 이용이 시작될 때 array 로 저장된다.',
  `reg_date` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`map_info`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`map_info` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_admin_id` VARCHAR(45) NOT NULL,
  `area` VARCHAR(45) NOT NULL,
  `coordinates` VARCHAR(45) NOT NULL,
  `reg_date` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`terms`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`terms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  `contents` LONGTEXT NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  `reg_date` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`invitations`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`invitations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `recommender_id` VARCHAR(45) NOT NULL,
  `invited_id` VARCHAR(45) NOT NULL,
  `code` VARCHAR(45) NULL,
  `reg_date` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`notices`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`notices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  `contents` VARCHAR(45) NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  `reg_date` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`users_admin`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`users_admin` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(20) NOT NULL COMMENT '최고관리자 : super_admin\n본사 : hq\n본사 직원 : hq_worker\n가맹점 : store\n가맹점 직원 : store_worker\n',
  `store_name` VARCHAR(100) NULL,
  `biz_type` VARCHAR(45) NULL,
  `biz_sub_type` VARCHAR(45) NULL,
  `ceo` VARCHAR(20) NULL,
  `email` VARCHAR(45) NULL,
  `mobile` VARCHAR(45) NOT NULL,
  `mobile_auth` VARCHAR(45) NULL,
  `address` VARCHAR(255) NULL,
  `address_detail` VARCHAR(255) NULL,
  `biz_reg` VARCHAR(20) NULL,
  `password` VARCHAR(255) NOT NULL,
  `bank` VARCHAR(45) NULL,
  `account_number` VARCHAR(45) NULL,
  `account_holder` VARCHAR(45) NULL,
  `is_active` VARCHAR(10) NULL,
  `reg_date` DATETIME NULL,
  `update_date` DATETIME NULL,
  `user_name` VARCHAR(45) NULL,
  `belonging_user_admin_id` VARCHAR(45) NULL COMMENT '소속 스토어 ID\n(가맹점 ID 등)',
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`payment_history_monthly`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`payment_history_monthly` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_admin_id` INT NULL,
  `year` VARCHAR(10) NULL,
  `month` VARCHAR(10) NULL,
  `total` VARCHAR(45) NULL,
  `is_adjusted` VARCHAR(45) NULL,
  `adjusted_amount` VARCHAR(45) NULL,
  `remarks` VARCHAR(45) NULL,
  `last_update` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`relocation_places`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`relocation_places` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_admin_id` INT NOT NULL,
  `places` VARCHAR(10000) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`request_history`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`request_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_admin_id` INT NOT NULL,
  `bike_id` VARCHAR(45) NULL,
  `requested_area` VARCHAR(45) NOT NULL,
  `requested_to` VARCHAR(45) NULL,
  `reg_date` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`payment_history_daily`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`payment_history_daily` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_admin_id` VARCHAR(45) NULL,
  `date` DATE NULL,
  `total` VARCHAR(45) NULL,
  `last_update` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`work_history`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`work_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `belonging_user_admin_id` INT NOT NULL,
  `user_admin_id` INT NOT NULL COMMENT '처리한 담당자 ID',
  `user_name` VARCHAR(45) NOT NULL,
  `bike_id` VARCHAR(45) NOT NULL,
  `place_name` VARCHAR(45) NULL,
  `task` VARCHAR(45) NOT NULL,
  `comments` VARCHAR(45) NULL,
  `reg_date` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`iot_status`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`iot_status` (
  `bike_id` VARCHAR(45) NOT NULL,
  `battery` VARCHAR(10) NOT NULL,
  `lat` VARCHAR(100) NOT NULL,
  `lng` VARCHAR(45) NOT NULL,
  `signal_strength` VARCHAR(45) NOT NULL,
  `led` VARCHAR(45) NOT NULL,
  `status` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`bike_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`info_bike_status`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`info_bike_status` (
  `status` VARCHAR(45) NULL COMMENT '1. stand_by\n2. in_use\n3. battery_charging_required\n4. being_reported\n5. being_relocated\n6. requested_to_handle\n7. out_of_boundary\n8. picked_up_for_repair\n9. error')
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`users_auth`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`users_auth` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `phone` VARCHAR(45) NOT NULL,
  `code` VARCHAR(45) NULL,
  `auth` VARCHAR(45) NULL,
  `is_success` VARCHAR(45) NULL,
  `reg_date` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`user_coupons`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`user_coupons` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `coupon_id` VARCHAR(45) NOT NULL,
  `expiration_date` VARCHAR(45) NOT NULL,
  `is_used` VARCHAR(45) NULL DEFAULT 'NO',
  `reg_date` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`customer_reports`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`customer_reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `report_categories_id` INT NOT NULL,
  `user_admin_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `bike_id` INT NOT NULL,
  `payment_history_id` INT NULL,
  `comments` VARCHAR(1000) NULL,
  `reg_date` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`report_categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`report_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(45) NOT NULL COMMENT 'Fee / need_maintenance / illegal_parking\n',
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broonge`.`user_parked_coordinates`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broonge`.`user_parked_coordinates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(45) NOT NULL,
  `lat` VARCHAR(45) NOT NULL,
  `lng` VARCHAR(45) NOT NULL,
  `parked_place_name` VARCHAR(45) NULL,
  `reg_date` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
