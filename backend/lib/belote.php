<?php
// ============================================================
// lib/belote.php — Moteur de jeu Belote
// Contient toutes les règles de la belote classique
// ============================================================

// ---------- Constantes ----------

const SUITS  = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Valeurs des cartes hors atout
const POINTS_NORMAL = [
    '7' => 0, '8' => 0, '9' => 0, 'J' => 2,
    'Q' => 3, 'K' => 4, '10' => 10, 'A' => 11
];

// Valeurs des cartes à l'atout
const POINTS_TRUMP = [
    '7' => 0, '8' => 0, 'Q' => 3, 'K' => 4,
    '10' => 10, 'A' => 11, '9' => 14, 'J' => 20
];

// Ordre des cartes hors atout (pour déterminer qui gagne le pli)
const ORDER_NORMAL = [
    '7' => 1, '8' => 2, '9' => 3, 'J' => 4,
    'Q' => 5, 'K' => 6, '10' => 7, 'A' => 8
];

// Ordre des cartes à l'atout
const ORDER_TRUMP = [
    '7' => 1, '8' => 2, 'Q' => 3, 'K' => 4,
    '10' => 5, 'A' => 6, '9' => 7, 'J' => 8
];

// ---------- Distribution ----------

/**
 * Crée et mélange un jeu de 32 cartes
 * Retourne un tableau de ['suit'=>..., 'value'=>...]
 */
function createDeck(): array {
    $deck = [];
    foreach (SUITS as $suit) {
        foreach (VALUES as $value) {
            $deck[] = ['suit' => $suit, 'value' => $value];
        }
    }
    shuffle($deck);
    return $deck;
}

/**
 * Phase 1 de la distribution : 3+2 cartes à chaque joueur + 1 carte retournée.
 * S'arrête là. La phase 2 (3 cartes restantes) se fait dans bid.php après la prise.
 *
 * @param int   $roundId     ID du tour
 * @param int[] $playerIds  IDs des players dans l'ordre de distribution
 */
function dealCards(int $roundId, array $playerIds): void {
    $db   = getDB();
    $deck = createDeck(); // 32 cartes mélangées
    $idx  = 0;

    // --- 1ère passe : 3 cartes à chaque joueur ---
    foreach ($playerIds as $pid) {
        for ($i = 0; $i < 3; $i++) {
            $c = $deck[$idx++];
            $db->prepare('INSERT INTO cards (round_id, player_id, suit, value, status) VALUES (?,?,?,?,\'hand\')')
               ->execute([$roundId, $pid, $c['suit'], $c['value']]);
        }
    }

    // --- 2ème passe : 2 cartes à chaque joueur (total 5 en main) ---
    foreach ($playerIds as $pid) {
        for ($i = 0; $i < 2; $i++) {
            $c = $deck[$idx++];
            $db->prepare('INSERT INTO cards (round_id, player_id, suit, value, status) VALUES (?,?,?,?,\'hand\')')
               ->execute([$roundId, $pid, $c['suit'], $c['value']]);
        }
    }

    // --- 21ème carte : retournée, visible de tous ---
    // Chaque joueur a 5 cartes, 1 est retournée → reste 11 cartes pour la phase 2
    $turned = $deck[$idx++]; // index 20
    $db->prepare('INSERT INTO cards (round_id, player_id, suit, value, status) VALUES (?,NULL,?,?,\'talon_visible\')')
       ->execute([$roundId, $turned['suit'], $turned['value']]);

    // Stocker les 11 cartes restantes dans le talon (distribuées après la prise)
    while ($idx < 32) {
        $c = $deck[$idx++];
        $db->prepare('INSERT INTO cards (round_id, player_id, suit, value, status) VALUES (?,NULL,?,?,\'talon\')')
           ->execute([$roundId, $c['suit'], $c['value']]);
    }

    // Mémoriser la couleur proposée et l'ordre de distribution pour la phase 2
    $db->prepare('UPDATE rounds SET bid_suit_proposed=?, bid_turn=1, bid_order_count=0 WHERE id=?')
       ->execute([$turned['suit'], $roundId]);
}

// ---------- Validations de jeu ----------

/**
 * Vérifie si une carte peut légalement être jouée
 * Retourne true si légal, false sinon
 */
function isCardPlayable(int $roundId, int $playerId, string $suit, string $value, string $trumpSuit): bool {
    $db = getDB();

    // Cartes déjà jouées dans ce pli
    $round = $db->prepare('SELECT current_trick FROM rounds WHERE id = ?');
    $round->execute([$roundId]);
    $trickNum = (int)$round->fetchColumn();

    $played = $db->prepare(
        'SELECT c.suit, c.value, c.player_id, p.team
         FROM cards c JOIN players p ON c.player_id = p.id
         WHERE c.round_id = ? AND c.trick_num = ? AND c.status = \'played\'
         ORDER BY c.play_order ASC'
    );
    $played->execute([$roundId, $trickNum]);
    $trickCards = $played->fetchAll();

    // Si on est le premier à jouer, toutes les cartes sont jouables
    if (empty($trickCards)) return true;

    $leadSuit = $trickCards[0]['suit'];
    $leadCard = $trickCards[0];

    // Cartes en main du joueur
    $hand = $db->prepare('SELECT suit, value FROM cards WHERE round_id = ? AND player_id = ? AND status = \'hand\'');
    $hand->execute([$roundId, $playerId]);
    $handCards = $hand->fetchAll();

    // La carte que le joueur veut jouer est-elle en main ?
    $inHand = false;
    foreach ($handCards as $c) {
        if ($c['suit'] === $suit && $c['value'] === $value) { $inHand = true; break; }
    }
    if (!$inHand) return false;

    // --- Règles de belote ---

    // Le joueur a-t-il la couleur demandée ?
    $hasSuit = array_filter($handCards, fn($c) => $c['suit'] === $leadSuit);

    if ($suit === $trumpSuit) {
        // Le joueur joue atout
        if ($leadSuit === $trumpSuit) {
            // La couleur demandée est l'atout : il doit monter si possible
            if (count($hasSuit) > 0) {
                // Il a des atouts — doit-il monter ?
                $highestTrumpInTrick = getHighestTrump($trickCards, $trumpSuit);
                $cardOrder = ORDER_TRUMP[$value];
                $highestOrder = $highestTrumpInTrick ? ORDER_TRUMP[$highestTrumpInTrick['value']] : 0;
                // Vérifier si le joueur peut monter
                $canBeat = false;
                foreach ($handCards as $c) {
                    if ($c['suit'] === $trumpSuit && ORDER_TRUMP[$c['value']] > $highestOrder) {
                        $canBeat = true; break;
                    }
                }
                if ($canBeat && $cardOrder <= $highestOrder) return false; // doit monter
            }
            return true; // joue atout
        } else {
            // La couleur demandée n'est pas l'atout
            if (count($hasSuit) > 0) {
                // Il a la couleur demandée — ne peut pas jouer atout sauf si partenaire ne gagne pas
                // (règle : on peut couper si on n'a pas la couleur)
                return false;
            }
            // Il n'a pas la couleur — peut couper ou défausser
            return true;
        }
    } else {
        // Le joueur joue non-atout
        if ($leadSuit === $trumpSuit) {
            // La couleur demandée est l'atout — il doit jouer atout s'il en a
            if (count($hasSuit) > 0) return false; // doit jouer atout
            return true; // pas d'atout, peut se défausser
        } else {
            // La couleur demandée n'est pas l'atout
            if (count($hasSuit) > 0 && $suit !== $leadSuit) return false; // doit fournir
            if (count($hasSuit) === 0 && $suit !== $trumpSuit) {
                // N'a pas la couleur — doit couper si possible, sauf si le partenaire gagne le pli
                $hasTrump = array_filter($handCards, fn($c) => $c['suit'] === $trumpSuit);
                if (count($hasTrump) > 0) {
                    // Vérifier si partenaire gagne déjà le pli
                    $partnerTeam = getPlayerTeam($playerId);
                    $currentWinner = getTrickWinner($trickCards, $trumpSuit);
                    if ($currentWinner && $currentWinner['team'] == $partnerTeam) {
                        return true; // partenaire gagne, pas obligé de couper
                    }
                    return false; // doit couper
                }
            }
            return true;
        }
    }
}

/**
 * Retourne la carte atout la plus haute dans un pli
 */
function getHighestTrump(array $cards, string $trumpSuit): ?array {
    $highest = null;
    $highOrder = -1;
    foreach ($cards as $c) {
        if ($c['suit'] === $trumpSuit) {
            $o = ORDER_TRUMP[$c['value']];
            if ($o > $highOrder) { $highOrder = $o; $highest = $c; }
        }
    }
    return $highest;
}

/**
 * Retourne le gagnant actuel d'un pli (tableau card + team)
 */
function getTrickWinner(array $cards, string $trumpSuit): ?array {
    if (empty($cards)) return null;
    $winner = $cards[0];
    $leadSuit = $cards[0]['suit'];

    foreach (array_slice($cards, 1) as $c) {
        if ($c['suit'] === $trumpSuit && $winner['suit'] !== $trumpSuit) {
            $winner = $c; // coup de coupe
        } elseif ($c['suit'] === $winner['suit']) {
            $orderMap = ($c['suit'] === $trumpSuit) ? ORDER_TRUMP : ORDER_NORMAL;
            if ($orderMap[$c['value']] > $orderMap[$winner['value']]) {
                $winner = $c;
            }
        }
    }
    return $winner;
}

/**
 * Calcule les points d'un pli
 */
function calculateTrickPoints(array $cards, string $trumpSuit, bool $isLastTrick): int {
    $pts = 0;
    foreach ($cards as $c) {
        $pts += ($c['suit'] === $trumpSuit)
            ? POINTS_TRUMP[$c['value']]
            : POINTS_NORMAL[$c['value']];
    }
    if ($isLastTrick) $pts += 10; // dix de der
    return $pts;
}

/**
 * Retourne l'équipe d'un joueur (player.id, pas user.id)
 */
function getPlayerTeam(int $playerId): int {
    $stmt = getDB()->prepare('SELECT team FROM players WHERE id = ?');
    $stmt->execute([$playerId]);
    return (int)$stmt->fetchColumn();
}

/**
 * Calcule et enregistre le résultat d'un pli terminé
 * Retourne ['winner_player_id'=>..., 'winner_team'=>..., 'points'=>...]
 */
function finalizeTrick(int $roundId, int $trickNum, string $trumpSuit): array {
    $db = getDB();

    // Récupérer les cartes du pli avec infos joueur/équipe
    $stmt = $db->prepare(
        'SELECT c.suit, c.value, c.player_id, p.team
         FROM cards c JOIN players p ON c.player_id = p.id
         WHERE c.round_id = ? AND c.trick_num = ?
         ORDER BY c.play_order ASC'
    );
    $stmt->execute([$roundId, $trickNum]);
    $cards = $stmt->fetchAll();

    $isLast = ($trickNum === 7);
    $points = calculateTrickPoints($cards, $trumpSuit, $isLast);
    $winner = getTrickWinner($cards, $trumpSuit);

    // Enregistrer le pli
    $db->prepare(
        'INSERT INTO turns (round_id, trick_num, winner_player_id, winner_team, points, completed)
         VALUES (?,?,?,?,?,1)
         ON DUPLICATE KEY UPDATE winner_player_id=VALUES(winner_player_id),
         winner_team=VALUES(winner_team), points=VALUES(points), completed=1'
    )->execute([$roundId, $trickNum, $winner['player_id'], $winner['team'], $points]);

    // Marquer les cartes comme trick_won
    $db->prepare(
        'UPDATE cards SET status=\'trick_won\' WHERE round_id=? AND trick_num=?'
    )->execute([$roundId, $trickNum]);

    return [
        'winner_player_id' => $winner['player_id'],
        'winner_team'      => $winner['team'],
        'points'           => $points,
    ];
}

/**
 * Finalise la manche en belote CLASSIQUE.
 *
 * Règle : le preneur doit faire STRICTEMENT PLUS de points que l'adversaire
 * (au moins 82 sur 162, car en cas d'égalité à 81/81 le preneur perd).
 * Si le preneur a tous les plis (capot), il marque 162 + 10 de der = bonus.
 * Si le preneur échoue, l'adversaire prend TOUS les points (162 + belote éventuelle).
 */
function finalizeRound(int $roundId): array {
    $db = getDB();
    $round = $db->prepare('SELECT * FROM rounds WHERE id = ?');
    $round->execute([$roundId]);
    $r = $round->fetch();

    // Points bruts par équipe (incluant le dix de der du dernier pli)
    $stmt = $db->prepare('SELECT winner_team, SUM(points) as total FROM turns WHERE round_id=? AND round_num=? AND completed=1 GROUP BY winner_team');
    $stmt->execute([$roundId, $r["round_number"]]);
    $scores = [1 => 0, 2 => 0];
    foreach ($stmt->fetchAll() as $row) {
        $scores[(int)$row['winner_team']] = (int)$row['total'];
    }

    $bidTeam     = (int)$r['bid_team'];
    $oppTeam     = $bidTeam === 1 ? 2 : 1;
    $beloteBonus = ($r['belote_player_id'] && $r['rebelote_done']) ? 20 : 0;
    $beloteTeam  = getTeamOfBelote($r['belote_player_id'] ? (int)$r['belote_player_id'] : null);

    $takerPoints = $scores[$bidTeam];
    $oppPoints   = $scores[$oppTeam];
    $total       = $takerPoints + $oppPoints; // doit valoir 152 + 10 = 162

    // Capot : le preneur a remporté TOUS les plis (adversaire a 0 points bruts)
    $isCapot = ($oppPoints === 0);

    // Le preneur doit avoir STRICTEMENT PLUS que l'adversaire (> 81)
    $takerWins = $isCapot || ($takerPoints > $oppPoints);

    if ($takerWins) {

        $db->prepare(
            'UPDATE players SET nb_rounds_taken_won=(SELECT nb_rounds_taken_won FROM players WHERE id = ?)+1 WHERE id=?'
        )->execute([$r["trump_player_id"], $r["trump_player_id"]]);

        $team1pts = $scores[1] + ($beloteTeam === 1 ? $beloteBonus : 0);
        $team2pts = $scores[2] + ($beloteTeam === 2 ? $beloteBonus : 0);
        if ($isCapot) {
            // Bonus capot : le preneur prend tout + 100 points bonus
            $team1pts = $bidTeam === 1 ? 252 : 0;
            $team2pts = $bidTeam === 2 ? 252 : 0;
        }
    } else {
        // Contrat chuté : l'adversaire prend tout (162 pts)
        // Le preneur garde quand même la belote si elle lui appartient
        $beloteForTaker = ($beloteTeam === $bidTeam) ? $beloteBonus : 0;
        $beloteForOpp   = ($beloteTeam === $oppTeam)  ? $beloteBonus : 0;
        if ($bidTeam === 1) {
            $team1pts = 0 + $beloteForTaker;
            $team2pts = 162 + $beloteForOpp;
        } else {
            $team2pts = 0 + $beloteForTaker;
            $team1pts = 162 + $beloteForOpp;
        }
    }

    // Arrondir à la dizaine
    /*$team1pts = roundBelote($team1pts);
    $team2pts = roundBelote($team2pts);*/

    // Mettre à jour les scores
    $db->prepare('UPDATE round SET team1_score=?, team2_score=? WHERE id=?')
       ->execute([$team1pts, $team2pts, $roundId]);

    return [
        'team1'      => $team1pts,
        'team2'      => $team2pts,
        'raw'        => $scores,
        'takerWins'  => $takerWins,
        'isCapot'    => $isCapot,
    ];
}

function getTeamOfBelote(?int $belotePlayerId): int {
    if (!$belotePlayerId) return 0;
    return getPlayerTeam($belotePlayerId);
}

/**
 * Vérifie la belote/rebelote (Roi + Dame d'atout en main)
 */
function checkBeloteRebelote(int $roundId, int $playerId, string $suit, string $value, string $trumpSuit): ?string {
    if ($suit !== $trumpSuit) return null;
    if ($value !== 'K' && $value !== 'Q') return null;

    $db = getDB();
    $other = ($value === 'K') ? 'Q' : 'K';

    // A-t-il l'autre carte de belote en main ?
    $belote_possible = true;

    $stmt = $db->prepare('SELECT 1 FROM cards WHERE round_id=? AND player_id=? AND suit=? AND value=? AND status=\'hand\'');
    $stmt->execute([$roundId, $playerId, $trumpSuit, $other]);
    if (!$stmt->fetchColumn()) $belote_possible = false;

    // Vérifier si belote déjà annoncée
    $round = $db->prepare('SELECT belote_player_id, rebelote_done FROM round WHERE id=?');
    $round->execute([$roundId]);
    $r = $round->fetch();

    if (!$r['belote_player_id'] && $belote_possible) {
        return 'belote'; // première carte (Roi ou Dame)
    } elseif ($r['belote_player_id'] == $playerId && !$r['rebelote_done']) {
        return 'rebelote'; // deuxième carte
    }
    return null;
}
