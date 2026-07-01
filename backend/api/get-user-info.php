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

$gameId = (int)($_GET['gameId'] ??0);
if (!$gameId){
    $infos_user = $db->prepare('SELECT u.pseudo AS pseudo FROM users u WHERE u.id = ?');
    $infos_user->execute([$userId]);

    success(['infos' => $infos_user->fetch()]);
}else{
    $infos_user = $db->prepare('SELECT u.pseudo AS pseudo, p.is_connected AS is_connected, p.nb_rounds_taken AS nb_rounds_taken, p.nb_rounds_taken_won AS nb_rounds_taken_won FROM users u, players p WHERE u.id = p.user_id AND u.id = ? AND p.game_id = ?');
    $infos_user->execute([$userId, $gameId]);

    success(['infos' => $infos_user->fetch()]);
}