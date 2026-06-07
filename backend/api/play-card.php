<?php
// ============================================================
// api/play-card.php — Jouer une carte
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/belote.php';

setCorsHeaders();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Méthode non autorisée', 405);
}

$body   = getJsonBody();
$gameId = (int)($body['gameId'] ?? 0);
$suit   = $body['suit'] ?? '';
$value  = $body['value'] ?? '';

$db = getDB();

// Charger la partie
$gStmt = $db->prepare('SELECT * FROM games WHERE id = ?');
$gStmt->execute([$gameId]);
$g = $gStmt->fetch();
if (!$g) error('Partie introuvable');
if ($g['status'] !== 'playing') error('La partie n\'est pas en cours');

$trumpSuit = $g['trump_suit'];

// Joueur dans la partie
$pStmt = $db->prepare('SELECT * FROM players WHERE game_id = ? AND user_id = ?');
$pStmt->execute([$gameId, $user['id']]);
$player = $pStmt->fetch();
if (!$player) error('Vous n\'êtes pas dans cette partie');

// C'est son tour ?
if ((int)$g['current_player_id'] !== (int)$player['id']) {
    error('Ce n\'est pas votre tour');
}

// Vérifier que la carte est jouable
if (!isCardPlayable($gameId, $player['id'], $suit, $value, $trumpSuit)) {
    error('Vous ne pouvez pas jouer cette carte (règle de belote)');
}

// Compter les cartes dans ce pli
$trickNum = (int)$g['current_trick'];
$countStmt = $db->prepare('SELECT COUNT(*) FROM cards WHERE game_id=? AND trick_num=? AND status=\'played\'');
$countStmt->execute([$gameId, $trickNum]);
$playOrder = (int)$countStmt->fetchColumn() + 1;

// Belote/Rebelote ?
$beloteAnnounce = checkBeloteRebelote($gameId, $player['id'], $suit, $value, $trumpSuit);
if ($beloteAnnounce === 'belote') {
    $db->prepare('UPDATE games SET belote_player_id=? WHERE id=?')->execute([$player['id'], $gameId]);
} elseif ($beloteAnnounce === 'rebelote') {
    $db->prepare('UPDATE games SET rebelote_done=1 WHERE id=?')->execute([$gameId]);
}

// Jouer la carte
$db->prepare(
    'UPDATE cards SET status=\'played\', trick_num=?, play_order=?, played_at=NOW()
     WHERE game_id=? AND player_id=? AND suit=? AND value=? AND status=\'hand\''
)->execute([$trickNum, $playOrder, $gameId, $player['id'], $suit, $value]);

$nextData = [];

// Si 4 cartes jouées → terminer le pli
if ($playOrder === 4) {
    $result   = finalizeTrick($gameId, $trickNum, $trumpSuit);
    $nextTrick = $trickNum + 1;

    if ($nextTrick >= 8) {
        // Fin de la manche
        $scores = finalizeRound($gameId);

        // Vérifier si la partie est terminée (ex: 1000 pts)
        $totals = $db->prepare('SELECT team1_total, team2_total FROM games WHERE id=?');
        $totals->execute([$gameId]);
        $t = $totals->fetch();
        $gameOver = ($t['team1_total'] >= 1000 || $t['team2_total'] >= 1000);

        if ($gameOver) {
            $db->prepare('UPDATE games SET status=\'finished\' WHERE id=?')->execute([$gameId]);
            $db->prepare('DELETE FROM cards WHERE game_id=?')->execute([$gameId]);
            $db->prepare('DELETE FROM bids WHERE game_id=?')->execute([$gameId]);
            $db->prepare('DELETE FROM turns WHERE game_id=?')->execute([$gameId]);
        } else {
            // Nouvelle manche : changer le donneur et redistribuer
            $seatsStmt = $db->prepare('SELECT id, seat FROM players WHERE game_id=? ORDER BY seat');
            $seatsStmt->execute([$gameId]);
            $seats    = $seatsStmt->fetchAll();
            $seatMap  = array_column($seats, 'id', 'seat');
            $idToSeat = array_flip($seatMap);

            $oldDealerSeat  = $idToSeat[(int)$g['dealer_id']];
            $newDealerSeat  = ($oldDealerSeat + 1) % 4;
            $newDealer      = $seatMap[$newDealerSeat];
            $newFirstBidder = $seatMap[($newDealerSeat + 1) % 4];

            $db->prepare('DELETE FROM cards WHERE game_id=?')->execute([$gameId]);
            $db->prepare('DELETE FROM bids WHERE game_id=?')->execute([$gameId]);
            $db->prepare('DELETE FROM turns WHERE game_id=?')->execute([$gameId]);

            // Réinitialiser AVANT dealCards (qui va écrire bid_suit_proposed)
            $db->prepare(
                'UPDATE games SET status=\'bidding\', trump_suit=NULL, bid_team=NULL,
                 trump_player_id=NULL, bid_suit_proposed=NULL, bid_turn=1, bid_order_count=0,
                 current_trick=0, dealer_id=?, current_player_id=?, round_number=round_number+1,
                 belote_player_id=NULL, rebelote_done=0 WHERE id=?'
            )->execute([$newDealer, $newFirstBidder, $gameId]);

            $ordered = [];
            for ($i = 1; $i <= 4; $i++) $ordered[] = $seatMap[($newDealerSeat + $i) % 4];
            dealCards($gameId, $ordered);
        }

        $nextData = ['roundOver' => true, 'scores' => $scores, 'gameOver' => $gameOver ?? false];
    } else {
        // Prochain pli : le gagnant du pli joue en premier
        $db->prepare(
            'UPDATE games SET current_trick=?, current_player_id=? WHERE id=?'
        )->execute([$nextTrick, $result['winner_player_id'], $gameId]);
        $nextData = ['trickWinner' => $result];
    }
} else {
    // Prochain joueur dans le pli
    $seatsStmt = $db->prepare('SELECT id, seat FROM players WHERE game_id=? ORDER BY seat');
    $seatsStmt->execute([$gameId]);
    $seats    = $seatsStmt->fetchAll();
    $seatMap  = array_column($seats, 'id', 'seat');
    $idToSeat = array_flip($seatMap);

    $currentSeat  = $idToSeat[$player['id']];
    $nextSeat     = ($currentSeat + 1) % 4;
    $nextPlayerId = $seatMap[$nextSeat];

    $db->prepare('UPDATE games SET current_player_id=? WHERE id=?')->execute([$nextPlayerId, $gameId]);
}

success(array_merge([
    'played'   => ['suit' => $suit, 'value' => $value],
    'belote'   => $beloteAnnounce,
], $nextData));
