<?php
// ============================================================
// api/create-game.php — Créer une nouvelle partie
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

setCorsHeaders();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Méthode non autorisée', 405);
}

$db   = getDB();
$code = generateGameCode();

// Créer la partie
$db->prepare('INSERT INTO games (code, status) VALUES (?,\'waiting\')')
   ->execute([$code]);
$gameId = (int)$db->lastInsertId();

$db->prepare('INSERT INTO rounds (game_id) VALUES (?)')
   ->execute([$gameId]);

// Ajouter le créateur comme premier joueur (siège 0 = Nord, équipe 1)
$db->prepare('INSERT INTO players (game_id, user_id, seat, team, last_ping) VALUES (?,?,0,1,NOW())')
   ->execute([$gameId, $user['id']]);

success([
    'gameId' => $gameId,
    'code'   => $code,
    'seat'   => 0,
    'team'   => 1,
]);
