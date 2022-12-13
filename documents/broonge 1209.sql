-- MySQL dump 10.13  Distrib 8.0.31, for macos12 (arm64)
--
-- Host: localhost    Database: broonge
-- ------------------------------------------------------
-- Server version	8.0.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bikes`
--

DROP TABLE IF EXISTS `bikes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bikes` (
  `id` int NOT NULL,
  `owner_user_admin_id` int NOT NULL,
  `operated_on_date` date DEFAULT NULL,
  `issued_person_user_admin_id` int DEFAULT NULL,
  `is_active` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'YES',
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bikes`
--

LOCK TABLES `bikes` WRITE;
/*!40000 ALTER TABLE `bikes` DISABLE KEYS */;
INSERT INTO `bikes` VALUES (1241212319,2,'2022-12-08',1,'YES','2022-12-08 23:39:00');
/*!40000 ALTER TABLE `bikes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon_info`
--

DROP TABLE IF EXISTS `coupon_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(45) NOT NULL COMMENT 'amount / discount ',
  `coupon_number` varchar(30) DEFAULT NULL COMMENT '관리자가 수동으로 쿠폰을 등록할 때 발급하는 번호이다. ',
  `coupon_name` varchar(45) NOT NULL,
  `issue_cause` varchar(45) NOT NULL,
  `is_active` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'YES' COMMENT '이는 관리자가 수동으로 발급 후 정지할 수도 있다. 이 경우, ''NO'' 로 하면 된다.\n이용자가 쿠폰을 넣고 자신이 발급받을 때 한 번 사용 후 두 번 사용은 안 되기 때문에 ''NO'' 로 바뀌어야 한다.\n\n쿠폰번호는 삭제할 수 없다. 무슨 이유로 발급 받았는지 알아야 하기 때문이다.',
  `amount` int DEFAULT NULL,
  `discount_rate` varchar(45) DEFAULT NULL,
  `basic_duration` varchar(45) NOT NULL COMMENT 'Days\n',
  `is_issued_to_user` varchar(5) DEFAULT 'NO' COMMENT '이용자가 쿠폰번호를 제대로 입력하면 발급완료인 ''YES'' 로 변경된다.',
  `reg_date` datetime DEFAULT NULL,
  `date_issued_to_user` datetime DEFAULT NULL COMMENT '이용자가 쿠폰을 입력한 일시',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_info`
--

LOCK TABLES `coupon_info` WRITE;
/*!40000 ALTER TABLE `coupon_info` DISABLE KEYS */;
INSERT INTO `coupon_info` VALUES (1,'auto','1','환영 쿠폰','신규가입 시 자동발급','YES',1000,'','15','NO',NULL,NULL),(2,'manual','1234','수동입력쿠폰이름','관리자등록','NO',2000,'','15','YES','2020-04-13 01:00:00','2022-12-09 00:07:06');
/*!40000 ALTER TABLE `coupon_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_reports`
--

DROP TABLE IF EXISTS `customer_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_categories_id` int NOT NULL,
  `user_id` int NOT NULL,
  `bike_id` varchar(20) NOT NULL,
  `payment_history_id` int DEFAULT NULL,
  `comments` varchar(1000) DEFAULT NULL,
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_reports`
--

LOCK TABLES `customer_reports` WRITE;
/*!40000 ALTER TABLE `customer_reports` DISABLE KEYS */;
INSERT INTO `customer_reports` VALUES (1,1,1,'1241212319',1,'이용요금이 이상해요. 3분 탔는데, 700원 나왔어요.','2022-12-09 00:07:06'),(2,1,1,'1241212319',1,'이용요금이 이상해요. 3분 탔는데, 700원 나왔어요.','2022-12-09 00:11:35'),(3,1,1,'1241212319',1,'이용요금이 이상해요. 3분 탔는데, 700원 나왔어요.','2022-12-09 11:06:17'),(4,1,1,'1241212319',1,'신고합니다','2022-12-09 11:06:17');
/*!40000 ALTER TABLE `customer_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(45) NOT NULL,
  `contents` longtext NOT NULL,
  `type` varchar(45) NOT NULL,
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'이용가이드','이용가이드 컨텐츠 입니다. 나중에 HTML 형태로 보여질 것이고, WYSISYG 게시판 형태로 진행될 예정 입니다.','guides','2022-12-08 20:19:00'),(2,'공지사항 제목 1','공지사항 컨텐츠 입니다. 나중에 HTML 형태로 보여질 것이고, WYSISYG 게시판 형태로 진행될 예정 입니다.','notices','2022-12-08 20:05:00'),(3,'공지사항 제목 2','이곳에는 글뿐만 아니라 사진도 들어갑니다.<br>추가적으로 링크랑 색상변경도 됩니다.','notices','2022-12-08 22:07:00'),(4,'이벤트 제목 1','이곳에서 다양한 이벤트 컨텐츠를 보내줄 수 있습니다. ','events','2022-12-08 22:10:00'),(5,'이벤트 제목 2','물론, 사진이랑 링크도 넣을 수 있습니다.','events','2022-12-08 22:11:00');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gps_tracking`
--

DROP TABLE IF EXISTS `gps_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gps_tracking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bike_id` int NOT NULL,
  `coordinates` mediumtext NOT NULL,
  `riding_data_id` int DEFAULT NULL COMMENT '자전거 이용이 시작될 때 array 로 저장된다.',
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gps_tracking`
--

LOCK TABLES `gps_tracking` WRITE;
/*!40000 ALTER TABLE `gps_tracking` DISABLE KEYS */;
/*!40000 ALTER TABLE `gps_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invitations`
--

DROP TABLE IF EXISTS `invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recommender_id` varchar(45) NOT NULL,
  `invited_id` varchar(45) NOT NULL,
  `code` varchar(45) DEFAULT NULL,
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitations`
--

LOCK TABLES `invitations` WRITE;
/*!40000 ALTER TABLE `invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iot_status`
--

DROP TABLE IF EXISTS `iot_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iot_status` (
  `bike_id` varchar(45) NOT NULL,
  `battery` varchar(10) NOT NULL,
  `lat` varchar(100) NOT NULL,
  `lng` varchar(45) NOT NULL,
  `signal_strength` varchar(45) NOT NULL,
  `led` varchar(45) NOT NULL,
  `status` varchar(45) NOT NULL,
  `is_locked` varchar(5) DEFAULT 'YES',
  `point` point DEFAULT NULL,
  PRIMARY KEY (`bike_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iot_status`
--

LOCK TABLES `iot_status` WRITE;
/*!40000 ALTER TABLE `iot_status` DISABLE KEYS */;
INSERT INTO `iot_status` VALUES ('1231','98','37.333','127.333','3','off','unlocked','YES',NULL),('1241212318','99','37.2114350','37.2114350','5','on','unlocked','YES',NULL),('1241212319','12','37.11111','127.77777','5','on','unlocked','YES',_binary '\0\0\0\0\0\0\0!<\�8�B@\�s\��\�\�_@');
/*!40000 ALTER TABLE `iot_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map_info`
--

DROP TABLE IF EXISTS `map_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_admin_id` varchar(45) NOT NULL,
  `area` varchar(45) NOT NULL,
  `coordinates` varchar(45) NOT NULL,
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_info`
--

LOCK TABLES `map_info` WRITE;
/*!40000 ALTER TABLE `map_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `map_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(45) NOT NULL,
  `contents` varchar(45) NOT NULL,
  `type` varchar(45) NOT NULL,
  `reg_date` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notices`
--

LOCK TABLES `notices` WRITE;
/*!40000 ALTER TABLE `notices` DISABLE KEYS */;
/*!40000 ALTER TABLE `notices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_history`
--

DROP TABLE IF EXISTS `payment_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `riding_data_id` varchar(45) NOT NULL,
  `amount` varchar(45) NOT NULL,
  `coupon_id` varchar(45) DEFAULT NULL,
  `payment_status` varchar(45) NOT NULL DEFAULT 'not_paid' COMMENT '결제가 완료 되었는지 여부 확인하기 : paid / not_paid / partially_paid / canceled / partially_canceled (결제완료 / 결제미완료 / 부분결제 / 결제취소 / 결제부분취소)',
  `payment_method` varchar(45) NOT NULL COMMENT 'card_only / card_with_coupon / coupon_only',
  `card_company` varchar(45) NOT NULL,
  `card_trx_serial_number` varchar(45) NOT NULL,
  `reg_date` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `card_trx_serial_number_UNIQUE` (`card_trx_serial_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_history`
--

LOCK TABLES `payment_history` WRITE;
/*!40000 ALTER TABLE `payment_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_history_daily`
--

DROP TABLE IF EXISTS `payment_history_daily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_history_daily` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_admin_id` varchar(45) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `total` varchar(45) DEFAULT NULL,
  `last_update` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_history_daily`
--

LOCK TABLES `payment_history_daily` WRITE;
/*!40000 ALTER TABLE `payment_history_daily` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_history_daily` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_history_monthly`
--

DROP TABLE IF EXISTS `payment_history_monthly`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_history_monthly` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_admin_id` int DEFAULT NULL,
  `year` varchar(10) DEFAULT NULL,
  `month` varchar(10) DEFAULT NULL,
  `total` varchar(45) DEFAULT NULL,
  `is_adjusted` varchar(45) DEFAULT NULL,
  `adjusted_amount` varchar(45) DEFAULT NULL,
  `remarks` varchar(45) DEFAULT NULL,
  `last_update` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_history_monthly`
--

LOCK TABLES `payment_history_monthly` WRITE;
/*!40000 ALTER TABLE `payment_history_monthly` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_history_monthly` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `relocation_places`
--

DROP TABLE IF EXISTS `relocation_places`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `relocation_places` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_admin_id` int NOT NULL,
  `places` varchar(10000) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `relocation_places`
--

LOCK TABLES `relocation_places` WRITE;
/*!40000 ALTER TABLE `relocation_places` DISABLE KEYS */;
/*!40000 ALTER TABLE `relocation_places` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_categories`
--

DROP TABLE IF EXISTS `report_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_categories` (
  `sequence` int NOT NULL,
  `category` varchar(45) NOT NULL COMMENT 'Fee / need_maintenance / illegal_parking\n'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_categories`
--

LOCK TABLES `report_categories` WRITE;
/*!40000 ALTER TABLE `report_categories` DISABLE KEYS */;
INSERT INTO `report_categories` VALUES (1,'이용요금'),(2,'고장'),(3,'불법주차');
/*!40000 ALTER TABLE `report_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_history`
--

DROP TABLE IF EXISTS `request_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_admin_id` int NOT NULL,
  `bike_id` varchar(45) DEFAULT NULL,
  `requested_area` varchar(45) NOT NULL,
  `requested_to` varchar(45) DEFAULT NULL,
  `reg_date` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_history`
--

LOCK TABLES `request_history` WRITE;
/*!40000 ALTER TABLE `request_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `request_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `riding_data`
--

DROP TABLE IF EXISTS `riding_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `riding_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_admin_id` int NOT NULL,
  `user_id` int NOT NULL,
  `bike_id` varchar(45) DEFAULT NULL,
  `parked_image` varchar(45) DEFAULT NULL,
  `is_locked` varchar(45) DEFAULT NULL,
  `reg_date` varchar(45) DEFAULT NULL,
  `update_date` varchar(45) DEFAULT NULL,
  `gps_tracking_id` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `riding_data`
--

LOCK TABLES `riding_data` WRITE;
/*!40000 ALTER TABLE `riding_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `riding_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_coupons`
--

DROP TABLE IF EXISTS `user_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `coupon_id` varchar(45) NOT NULL,
  `expiration_date` date NOT NULL COMMENT '이 부분은 coupon_info 에서 가져올 수가 없다. 왜냐하면, 기존 발급 받은 사람과, 정책상 기간이 변경되어 이 후에 오늘 사람의 지급일이 달라릴 때, 즉, A 라는 사람이 5일치 받았는데, 정책이 바뀌어서 10일로 바뀌면, 그리고 A 라는 사람은 만기가 1일 남았는데, 갑자기 기간이 6일 더 연장되는 효과를 가져올 수 있어서 결론은, 기존 발급 받은 사람이 정책 변경 후 그에 대한 영향을 받는 것을 막기 위함이다.',
  `is_used` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'NO',
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_coupons`
--

LOCK TABLES `user_coupons` WRITE;
/*!40000 ALTER TABLE `user_coupons` DISABLE KEYS */;
INSERT INTO `user_coupons` VALUES (1,1,'1','2022-12-23','NO',NULL),(31,1,'1234','2025-06-02','NO','2022-12-09 00:07:06');
/*!40000 ALTER TABLE `user_coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_parked_coordinates`
--

DROP TABLE IF EXISTS `user_parked_coordinates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_parked_coordinates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(45) NOT NULL,
  `lat` varchar(45) NOT NULL,
  `lng` varchar(45) NOT NULL,
  `parked_place_name` varchar(45) DEFAULT NULL,
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_parked_coordinates`
--

LOCK TABLES `user_parked_coordinates` WRITE;
/*!40000 ALTER TABLE `user_parked_coordinates` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_parked_coordinates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(45) NOT NULL,
  `mobile` varchar(45) NOT NULL,
  `user_rank` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `points` varchar(100) DEFAULT NULL,
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'이주이','01071809266','Black','10000','2022-12-07 17:00:00'),(2,'이주현','01041233333','Gold','5000','2022-12-07 17:01:01'),(3,'황민환','01093510386','Bronze','3000','2022-12-07 17:02:02'),(4,'동방진','01044797708','White','500','2022-12-07 17:03:03');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_admin`
--

DROP TABLE IF EXISTS `users_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL COMMENT '최고관리자 : super_admin\n본사 : hq\n본사 직원 : hq_worker\n가맹점 : store\n가맹점 직원 : store_worker\n',
  `store_name` varchar(100) DEFAULT NULL,
  `biz_type` varchar(45) DEFAULT NULL,
  `biz_sub_type` varchar(45) DEFAULT NULL,
  `ceo` varchar(20) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
  `mobile` varchar(45) NOT NULL,
  `mobile_auth` varchar(45) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `address_detail` varchar(255) DEFAULT NULL,
  `biz_reg` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `bank` varchar(45) DEFAULT NULL,
  `account_number` varchar(45) DEFAULT NULL,
  `account_holder` varchar(45) DEFAULT NULL,
  `is_active` varchar(10) DEFAULT NULL,
  `reg_date` datetime DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  `user_name` varchar(45) DEFAULT NULL,
  `belonging_user_admin_id` int DEFAULT NULL COMMENT '소속 스토어 ID\n(가맹점 ID 등)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_admin`
--

LOCK TABLES `users_admin` WRITE;
/*!40000 ALTER TABLE `users_admin` DISABLE KEYS */;
INSERT INTO `users_admin` VALUES (1,'superadmin','주식회사 부릉이','업종','업태','송병열','email@email.com','01094298138','mobile_auth_value','세종시~~~','호수공원 근처','1234567890','password','bank','11111111','예금주','YES','2022-12-08 23:26:00',NULL,'송병열',1),(2,'store','네이처컴바인드 주식회사','업종','업태','동방','dbj0729@naturecombined.com','01044797708','mobile_auth_value','경기도 화성시 동탄첨단산업1로27','금강펜테리움 IX타워 B동 344호','8818602075','password','기업','11111111','네이처컴바인드 주식회사','YES','2022-12-08 23:32:00',NULL,'동방진',2);
/*!40000 ALTER TABLE `users_admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_auth`
--

DROP TABLE IF EXISTS `users_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_auth` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(45) NOT NULL,
  `code` varchar(45) DEFAULT NULL,
  `auth` varchar(45) DEFAULT NULL,
  `is_success` varchar(45) DEFAULT NULL,
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_auth`
--

LOCK TABLES `users_auth` WRITE;
/*!40000 ALTER TABLE `users_auth` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_auth` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_cards`
--

DROP TABLE IF EXISTS `users_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(45) NOT NULL,
  `card_company` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `card_number` varchar(45) NOT NULL,
  `card_expiration_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `card_password` varchar(45) NOT NULL,
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_cards`
--

LOCK TABLES `users_cards` WRITE;
/*!40000 ALTER TABLE `users_cards` DISABLE KEYS */;
INSERT INTO `users_cards` VALUES (9,'1',NULL,'2222222222222222','1122','88',NULL),(10,'1',NULL,'1234123412341232','1223','01',NULL),(11,'1',NULL,'1234123412341232','1223','01',NULL);
/*!40000 ALTER TABLE `users_cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_history`
--

DROP TABLE IF EXISTS `work_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `belonging_user_admin_id` int NOT NULL,
  `user_admin_id` int NOT NULL COMMENT '처리한 담당자 ID',
  `user_name` varchar(45) NOT NULL,
  `bike_id` varchar(45) NOT NULL,
  `place_name` varchar(45) DEFAULT NULL,
  `task` varchar(45) NOT NULL,
  `comments` varchar(45) DEFAULT NULL,
  `reg_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_history`
--

LOCK TABLES `work_history` WRITE;
/*!40000 ALTER TABLE `work_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'broonge'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-12-09 19:00:40
