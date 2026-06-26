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

$total_rounds = $db->prepare('SELECT IFNULL(SUM(g.round_number), 0) AS total_rounds, IFNULL(SUM(p.nb_rounds_taken), 0) AS total_rounds_taken, IFNULL(SUM(p.nb_rounds_taken_won), 0) AS total_rounds_taken_won FROM games g, players p WHERE g.id = p.game_id AND p.user_id = ?');
$total_rounds->execute([$userId]);

success(['stats' => $total_rounds->fetch()]);