-- ============================================================
-- BELOTE MULTIJOUEUR - Schéma de base de données
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pseudo`     VARCHAR(32)  NOT NULL,
  `password`   VARCHAR(255) NOT NULL,
  `token`      VARCHAR(64)  NULL,
  `last_seen`  DATETIME     NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pseudo` (`pseudo`),
  KEY `idx_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: games
-- ============================================================
CREATE TABLE IF NOT EXISTS `games` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`            VARCHAR(8)   NOT NULL,          -- code d'accès 6 chars
  `status`          ENUM('waiting','bidding','playing','finished') NOT NULL DEFAULT 'waiting',
  `trump_suit`      ENUM('hearts','diamonds','clubs','spades') NULL, -- atout choisi
  `trump_player_id` INT UNSIGNED NULL,              -- joueur qui a choisi l'atout
  `current_player_id` INT UNSIGNED NULL,            -- joueur dont c'est le tour
  `current_trick`   INT UNSIGNED NOT NULL DEFAULT 0, -- pli en cours (0-7)
  `team1_score`     INT UNSIGNED NOT NULL DEFAULT 0,
  `team2_score`     INT UNSIGNED NOT NULL DEFAULT 0,
  `team1_total`     INT UNSIGNED NOT NULL DEFAULT 0, -- score cumulé sur plusieurs manches
  `team2_total`     INT UNSIGNED NOT NULL DEFAULT 0,
  `dealer_id`       INT UNSIGNED NULL,              -- donneur
  `bid_suit_proposed` ENUM('hearts','diamonds','clubs','spades') NULL, -- couleur carte retournée
  `bid_turn`        TINYINT UNSIGNED NOT NULL DEFAULT 1, -- tour d enchères : 1 ou 2
  `bid_order_count` TINYINT UNSIGNED NOT NULL DEFAULT 0, -- nb joueurs ayant parlé ce tour
  `bid_value`       INT UNSIGNED NULL,
  `bid_team`        TINYINT UNSIGNED NULL,          -- équipe ayant pris
  `belote_player_id` INT UNSIGNED NULL,             -- joueur ayant déclaré belote
  `rebelote_done`   TINYINT(1) NOT NULL DEFAULT 0,
  `round_number`    INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_code` (`code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: players (joueurs dans une partie)
-- ============================================================
CREATE TABLE IF NOT EXISTS `players` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `game_id`      INT UNSIGNED NOT NULL,
  `user_id`      INT UNSIGNED NOT NULL,
  `seat`         TINYINT UNSIGNED NOT NULL,   -- 0=Nord 1=Est 2=Sud 3=Ouest
  `team`         TINYINT UNSIGNED NOT NULL,   -- 1 ou 2 (Nord/Sud = 1, Est/Ouest = 2)
  `last_ping`    DATETIME NULL,               -- pour détecter déconnexion
  `is_connected` TINYINT(1) NOT NULL DEFAULT 1,
  `joined_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `nb_rounds_taken` INT UNSIGNED NOT NULL DEFAULT 0,
  `nb_rounds_taken_won` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_game_seat` (`game_id`, `seat`),
  UNIQUE KEY `uq_game_user` (`game_id`, `user_id`),
  KEY `idx_game_id` (`game_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: cards (état des cartes pour une partie)
-- ============================================================
CREATE TABLE IF NOT EXISTS `cards` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `game_id`     INT UNSIGNED NOT NULL,
  `player_id`   INT UNSIGNED NULL,           -- NULL si jouée/dans talon
  `suit`        ENUM('hearts','diamonds','clubs','spades') NOT NULL,
  `value`       ENUM('7','8','9','10','J','Q','K','A') NOT NULL,
  `status`      ENUM('hand','played','trick_won','talon_visible','talon') NOT NULL DEFAULT 'hand',
  `trick_num`   INT UNSIGNED NULL,           -- numéro du pli où elle a été jouée
  `play_order`  TINYINT UNSIGNED NULL,       -- ordre dans le pli (1-4)
  `played_at`   DATETIME NULL,
  `round_num`   INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_game_player` (`game_id`, `player_id`),
  KEY `idx_game_trick` (`game_id`, `trick_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: turns (historique des plis)
-- ============================================================
CREATE TABLE IF NOT EXISTS `turns` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `game_id`     INT UNSIGNED NOT NULL,
  `trick_num`   INT UNSIGNED NOT NULL,       -- numéro du pli (0-7)
  `winner_player_id` INT UNSIGNED NULL,
  `winner_team` TINYINT UNSIGNED NULL,
  `points`      INT UNSIGNED NOT NULL DEFAULT 0,
  `completed`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `round_num`   INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_game_trick` (`game_id`, `trick_num`),
  KEY `idx_game_id` (`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: bids (annonces/enchères)
-- ============================================================
CREATE TABLE IF NOT EXISTS `bids` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `game_id`     INT UNSIGNED NOT NULL,
  `player_id`   INT UNSIGNED NOT NULL,
  `action`      ENUM('pass','bid','coinche','surcoinche') NOT NULL,
  `suit`        ENUM('hearts','diamonds','clubs','spades') NULL,
  `value`       INT UNSIGNED NULL,           -- 80,90,100,110,120,130,140,150,160 ou 250(capot)
  `bid_order`   TINYINT UNSIGNED NOT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_game_id` (`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: messages (chat en jeu)
-- ============================================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `game_id`     INT UNSIGNED NOT NULL,
  `user_id`     INT UNSIGNED NOT NULL,
  `pseudo`      VARCHAR(32) NOT NULL,
  `content`     VARCHAR(500) NOT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_game_id` (`game_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CONTRAINTES DE CLÉS ÉTRANGÈRES
-- ============================================================
ALTER TABLE `games`
  ADD CONSTRAINT `fk_games_bid_team_player` FOREIGN KEY (`trump_player_id`) REFERENCES `players` (`id`) ON DELETE SET NULL;

ALTER TABLE `players`
  ADD CONSTRAINT `fk_players_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_players_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `cards`
  ADD CONSTRAINT `fk_cards_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cards_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE SET NULL;

ALTER TABLE `turns`
  ADD CONSTRAINT `fk_turns_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_turns_winner` FOREIGN KEY (`winner_player_id`) REFERENCES `players` (`id`) ON DELETE SET NULL;

ALTER TABLE `bids`
  ADD CONSTRAINT `fk_bids_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bids_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE;

ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
