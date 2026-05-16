<?php
// ============================================================
// api/list-games.php — Liste les parties en attente
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

setCorsHeaders();
$user = requireAuth();

$db = getDB();

$stmt = $db->prepare(
    'SELECT g.id, g.code, g.status, g.created_at,
            COUNT(p.id) as player_count,
            GROUP_CONCAT(u.pseudo ORDER BY p.seat SEPARATOR \', \') as pseudos
     FROM games g
     LEFT JOIN players p ON p.game_id = g.id
     LEFT JOIN users u ON u.id = p.user_id
     WHERE g.status IN (\'waiting\', \'bidding\', \'playing\')
       AND g.created_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)
     GROUP BY g.id
     ORDER BY g.created_at DESC
     LIMIT 20'
);
$stmt->execute();
$games = $stmt->fetchAll();

success(['games' => $games]);
