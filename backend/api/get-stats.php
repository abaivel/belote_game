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

$totalRoundsTakenWonStmt = $db->prepare('SELECT COUNT(*) AS total_games, COUNT(CASE g.winner_team WHEN p.team THEN 1 ELSE NULL END) AS total_games_won, IFNULL(SUM(p.nb_rounds_taken), 0) AS total_rounds_taken, IFNULL(SUM(p.nb_rounds_taken_won), 0) AS total_rounds_taken_won FROM players p, games g WHERE p.game_id = g.Id AND p.user_id = ?');
$totalRoundsTakenWonStmt->execute([$userId]);
$totalRoundsTakenWon = $totalRoundsTakenWonStmt->fetch();

$totalRoundsPlayedStmt = $db->prepare('SELECT IFNULL(COUNT(*), 0) AS total_rounds, IFNULL(COUNT(CASE r.belote_player_id WHEN p.id THEN 1 ELSE NULL END),0) AS nb_belote FROM rounds r, players p WHERE r.game_id = p.game_id AND p.user_id = ?');
$totalRoundsPlayedStmt->execute([$userId]);
$totalRoundsPlayed = $totalRoundsPlayedStmt->fetch();

$totalGamesWithEachPlayersStmt = $db->prepare("SELECT p2.user_id, u.pseudo, COUNT(CASE g.winner_team WHEN p.team THEN 1 ELSE NULL END) AS nb_victory, COUNT(CASE g.winner_team WHEN p.team THEN NULL ELSE 1 END) AS nb_fail, COUNT(CASE g.winner_team WHEN p.team THEN 1 ELSE NULL END)/COUNT(g.id) AS ratio FROM players p JOIN games g ON g.id = p.game_id JOIN players p2 ON p2.game_id=g.id AND p.team=p2.team AND p.id!=p2.id JOIN users u ON u.id=p2.user_id WHERE g.status='finished' AND p.user_id=? GROUP BY p2.user_id ORDER BY ratio");
$totalGamesWithEachPlayersStmt->execute([$userId]);
$totalGamesWithEachPlayers = $totalGamesWithEachPlayersStmt->fetchAll();
    

$playersWithHighestAndLowestVictory = [];
if (count($totalGamesWithEachPlayers) > 0) {
    $playersWithHighestAndLowestVictory = ['best' => $totalGamesWithEachPlayers[count($totalGamesWithEachPlayers) -1],
                                            'worst' => $totalGamesWithEachPlayers[0]
                                            ];
}

$totalRoundsTakenWithEachTrumpStmt = $db->prepare("SELECT r.trump, 
                                                    COUNT(*) AS total_taken, 
                                                    COUNT(CASE p.team 
                                                            WHEN 1 
                                                            THEN (CASE 
                                                                    WHEN team1_score>team2_score 
                                                                    THEN 1 
                                                                    ELSE NULL 
                                                                    END) 
                                                            ELSE (CASE 
                                                                    WHEN team1_score<team2_score 
                                                                    THEN 1 
                                                                    ELSE NULL 
                                                                    END) 
                                                            END) AS nb_victory 
                                                    FROM rounds r, players p 
                                                    WHERE r.game_id=p.game_id
                                                    AND p.user_id=? 
                                                    AND r.trump_player_id=p.id 
                                                    GROUP BY r.trump_suit");
$totalRoundsTakenWithEachTrumpStmt->execute([$userId]);
$totalRoundsTakenWithEachTrump = $totalRoundsTakenWithEachTrumpStmt->fetch();

/*$totalPlayerCardsWhenTakenStmt = $db->prepare("SELECT r.id, COUNT(c.id) AS nb_cards_trump
                                                    FROM rounds r, players p, (SELECT * FROM cards WHERE round_id=r.id LIMIT 21) c
                                                    WHERE r.game_id=p.game_id
                                                    AND c.round_id = r.id
                                                    AND p.user_id=? 
                                                    AND r.trump_player_id=p.id
                                                    AND c.player_id=p.id
                                                    AND c.suit=r.trump_suit
                                                    GROUP BY r.id");*/ //En cours



success(['stats' => [
    'total_games'=> $totalRoundsTakenWon["total_games"],
    'total_games_won'=> $totalRoundsTakenWon['total_games_won'],
    'total_rounds' => $totalRoundsPlayed["total_rounds"],
    'total_rounds_taken'=> $totalRoundsTakenWon["total_rounds_taken"],
    "total_rounds_taken_won"=> $totalRoundsTakenWon["total_rounds_taken_won"],
    "best_and_worst_players"=>$playersWithHighestAndLowestVictory,
    'total_belote_re'=> $totalRoundsPlayed['nb_belote'],
    'total_with_each_trump'=> $trumpPlayersWithEachTrump,
]]);