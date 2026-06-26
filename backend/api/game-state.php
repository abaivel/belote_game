<?php
// ============================================================
// api/game-state.php — État complet de la partie (polling)
// Appelé toutes les 2 secondes par le frontend
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/belote.php';

setCorsHeaders();
$user = requireAuth();

$gameId = (int)($_GET['gameId'] ?? 0);
if (!$gameId) error('gameId requis');

$db = getDB();

// Mettre à jour last_ping du joueur
$db->prepare('UPDATE players SET last_ping=NOW(), is_connected=1 WHERE game_id=? AND user_id=?')
   ->execute([$gameId, $user['id']]);

// Marquer les joueurs sans ping depuis DISCONNECT_TIMEOUT comme déconnectés
$db->prepare(
    'UPDATE players SET is_connected=0
     WHERE game_id=? AND last_ping < DATE_SUB(NOW(), INTERVAL ? SECOND)'
)->execute([$gameId, DISCONNECT_TIMEOUT]);

// Charger la partie
$gStmt = $db->prepare('SELECT * FROM games WHERE id = ?');
$gStmt->execute([$gameId]);
$g = $gStmt->fetch();
if (!$g) error('Partie introuvable');

// Joueurs
$pStmt = $db->prepare(
    'SELECT p.id, p.seat, p.team, p.is_connected, p.nb_rounds_taken, p.nb_rounds_taken_won, u.pseudo, u.id AS userId
     FROM players p JOIN users u ON p.user_id = u.id
     WHERE p.game_id = ? ORDER BY p.seat'
);
$pStmt->execute([$gameId]);
$players = $pStmt->fetchAll();

// Mon player_id
$myPlayer = null;
foreach ($players as $p) {
    if ($p['pseudo'] === $user['pseudo']) { $myPlayer = $p; break; }
}

// Mes cartes en main
$myCards = [];
if ($myPlayer) {
    $cStmt = $db->prepare('SELECT suit, value FROM cards WHERE game_id=? AND round_num=? AND player_id=? AND status=\'hand\' ORDER BY suit, value');
    $cStmt->execute([$gameId, $g["round_number"], $myPlayer['id']]);
    $myCards = $cStmt->fetchAll();
}

// Cartes jouées dans le pli courant
$trickCards = [];
if ($g['status'] === 'playing') {
    $tcStmt = $db->prepare(
        'SELECT c.suit, c.value, c.play_order, p.seat
         FROM cards c JOIN players p ON c.player_id = p.id
         WHERE c.game_id=? AND round_num=? AND c.trick_num=? AND c.status=\'played\'
         ORDER BY c.play_order ASC'
    );
    $tcStmt->execute([$gameId, $g["round_number"], $g['current_trick']]);
    $trickCards = $tcStmt->fetchAll();
}

// Historique des plis (pour score en cours)
$tricksStmt = $db->prepare('SELECT winner_team, SUM(points) as pts FROM turns WHERE game_id=? AND round_num=? AND completed=1 GROUP BY winner_team');
$tricksStmt->execute([$gameId, $g["round_number"]]);
$trickScores = [1 => 0, 2 => 0];
foreach ($tricksStmt->fetchAll() as $row) {
    $trickScores[(int)$row['winner_team']] = (int)$row['pts'];
}

// Nombre de cartes par joueur (pour affichage dos de carte)
$cardCounts = [];
$ccStmt = $db->prepare('SELECT player_id, COUNT(*) as cnt FROM cards WHERE game_id=? AND round_num=? AND status=\'hand\' GROUP BY player_id');
$ccStmt->execute([$gameId, $g["round_number"]]);
foreach ($ccStmt->fetchAll() as $row) {
    $cardCounts[(int)$row['player_id']] = (int)$row['cnt'];
}

// Dernier pli (pour affichage temporaire)
$lastTrick = [];
if ($g['current_trick'] > 0) {
    $ltStmt = $db->prepare(
        'SELECT c.suit, c.value, p.seat
         FROM cards c JOIN players p ON c.player_id = p.id
         WHERE c.game_id=? AND round_num=? AND c.trick_num=? AND c.status=\'trick_won\'
         ORDER BY c.play_order ASC'
    );
    $ltStmt->execute([$gameId, $g["round_number"], (int)$g['current_trick'] - 1]);
    $lastTrick = $ltStmt->fetchAll();
}

// Carte retournée (visible pendant les enchères)
$talonCard = null;
if ($g['status'] === 'bidding') {
    $tStmt = $db->prepare('SELECT suit, value FROM cards WHERE game_id=? AND round_num=? AND status=\'talon_visible\' LIMIT 1');
    $tStmt->execute([$gameId, $g["round_number"]]);
    $talonCard = $tStmt->fetch() ?: null;
}

// Messages récents (50 derniers)
$msgStmt = $db->prepare('SELECT pseudo, content, created_at FROM messages WHERE game_id=? ORDER BY created_at DESC LIMIT 50');
$msgStmt->execute([$gameId]);
$messages = array_reverse($msgStmt->fetchAll());

// Réponse complète
success([
    'game' => [
        'id'              => $g['id'],
        'code'            => $g['code'],
        'status'          => $g['status'],
        'trumpSuit'       => $g['trump_suit'],
        'trumpPlayerId'   => $g['trump_player_id'],
        'bidSuitProposed' => $g['bid_suit_proposed'],
        'bidTurn'         => (int)($g['bid_turn'] ?? 1),
        'bidTeam'         => $g['bid_team'],
        'currentTrick'    => $g['current_trick'],
        'currentPlayerId' => $g['current_player_id'],
        'dealerId'        => $g['dealer_id'],
        'team1Score'      => $g['team1_score'],
        'team2Score'      => $g['team2_score'],
        'team1Total'      => $g['team1_total'],
        'team2Total'      => $g['team2_total'],
        'belotePlayerId'  => $g['belote_player_id'],
        'rebeloteDone'    => (bool)$g['rebelote_done'],
        'roundNumber'     => $g['round_number'],
    ],
    'players'       => $players,
    'myPlayer'      => $myPlayer,
    'myCards'       => $myCards,
    'talonCard'     => $talonCard,
    'trickCards'    => $trickCards,
    'lastTrick'     => $lastTrick,
    'trickScores'   => $trickScores,
    'cardCounts'    => $cardCounts,
    'messages'      => $messages,
    'serverTime'    => date('c'),
]);
