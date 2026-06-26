<?php

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error('Méthode non autorisée', 405);
}

$userId = (int)($_GET['userId'] ?? 0);
if (!$userId) error('userId requis');

$db = getDB();

$totalRoundsTakenWonStmt = $db->prepare('SELECT COUNT(*) AS total_games, IFNULL(SUM(p.nb_rounds_taken), 0) AS total_rounds_taken, IFNULL(SUM(p.nb_rounds_taken_won), 0) AS total_rounds_taken_won FROM players p, games g WHERE p.game_id = g.Id AND g.s p.user_id = ?');
$totalRoundsTakenWonStmt->execute([$userId]);
$totalRoundsTakenWon = $totalRoundsTakenWonStmt->fetch();

$totalRoundsPlayedStmt = $db->prepare('SELECT IFNULL(COUNT(*), 0) AS total_rounds FROM rounds r, players p WHERE r.game_id = p.game_id AND p.user_id = ?');
$totalRoundsPlayedStmt->execute([$userId]);
$totalRoundsPlayed = $totalRoundsPlayedStmt->fetchColumn();






success(['stats' => [
    'total_games'=> $totalRoundsTakenWon["total_games"],
    'total_rounds' => $totalRoundsPlayed,
    'total_rounds_taken'=> $totalRoundsTakenWon["total_rounds_taken"],
    "total_rounds_taken_won"=> $totalRoundsPlayedWon["total_rounds_taken_won"],
]]);