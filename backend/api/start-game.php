<?php

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/belote.php';

// Handler global : toute exception PHP renvoie du JSON lisible
set_exception_handler(function(Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    // En production, ne pas exposer le message complet
    $msg = defined('DEBUG_MODE') && DEBUG_MODE
        ? $e->getMessage() . ' (ligne ' . $e->getLine() . ' dans ' . basename($e->getFile()) . ')'
        : 'Erreur serveur interne. Vérifiez que migration_v2.sql a été exécuté.';
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
});

setCorsHeaders();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    error('Méthode non autorisée', 405);
}

$body = getJsonBody();
$gameId = trim($body['gameId'] ?? '');

if (!$gameId) error('gameId requis');

$db = getDB();

$pStmt = $db->prepare('SELECT id, seat FROM players WHERE game_id = ? ORDER BY seat');
$pStmt->execute([$gameId]);
$players = $pStmt->fetchAll();

// Tableau indexé par siège
$bySeat = [];
foreach ($players as $p) {
    $bySeat[(int)$p['seat']] = $p;
}

$dealerSeat      = 0;
$dealerPlayerId  = $bySeat[$dealerSeat]['id'];
$firstBidderId   = $bySeat[($dealerSeat + 1) % 4]['id'];

// Ordre de distribution : commence par le joueur après le donneur
$orderedIds = [];
for ($i = 1; $i <= 4; $i++) {
    $orderedIds[] = $bySeat[($dealerSeat + $i) % 4]['id'];
}

$firstRoundStmt = $db->prepare("SELECT id FROM rounds WHERE game_id=? limit 1");
$firstRoundStmt->execute([$gameId]);
$firstRoundId = $firstRoundStmt->fetchColumn();

$db->prepare('UPDATE rounds SET dealer_id=?, current_player_id=? WHERE id=?')
->execute([$dealerPlayerId, $firstBidderId, $firstRoundId]);

$db->prepare('UPDATE games SET status=\'bidding\' WHERE id=?')
    ->execute([$gameId]);

dealCards($firstRoundId, $orderedIds);