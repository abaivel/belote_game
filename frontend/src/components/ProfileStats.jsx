import { StatDisplay } from './StatDisplay.jsx';
import { ProgressBar } from './ProgressBar.jsx';

const SUIT_SYMBOLS = {
  hearts:   { symbol: '♥', color: '#c0392b' },
  diamonds: { symbol: '♦', color: '#c0392b' },
  clubs:    { symbol: '♣', color: '#1a1a2e' },
  spades:   { symbol: '♠', color: '#1a1a2e' },
};

const VALUE_DISPLAY = {
  '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'Valet', 'Q': 'Dame', 'K': 'Roi', 'A': 'As',
};

export function ProfileStats({stats, setOtherUserId}) {

  return (
    <>
      <div className='div-stats-line'>
        <StatDisplay value={stats.total_games} label="Nombre de parties jouées"/>
        <StatDisplay value={stats.total_games_won} label="Nombre de parties gagnées"/>
        <StatDisplay value={stats.total_games==0 ? "-" : (stats.total_games_won/stats.total_games)*100 + "%"} label="Pourcentage de victoire"/>
      </div>
      <br></br>
      <div className='div-stat'>
        <h3>Performances</h3>
        <div>
          <table className='table-stats-performance'>
            <tbody>
              <tr>
                <td><p>Tours pris</p></td>
                <td><ProgressBar value={stats.total_rounds==0 ? 0 : (stats.total_rounds_taken/stats.total_rounds)*100}/></td>
                <td><p>{stats.total_rounds==0 ? 0 : Math.round((stats.total_rounds_taken/stats.total_rounds)*100)}%</p></td>
              </tr>
              <tr>
                <td><p>Tours gagnés</p></td>
                <td><ProgressBar value={stats.total_rounds_taken==0 ? 0 : (stats.total_rounds_taken_won/stats.total_rounds_taken)*100}/></td>
                <td><p>{stats.total_rounds_taken==0 ? 0 : Math.round((stats.total_rounds_taken_won/stats.total_rounds_taken)*100)}%</p></td>
              </tr>
              <tr>
                <td><p>Tours défendus</p></td>
                <td><ProgressBar value={stats.total_rounds_taken_by_other_team==0 ? 0 : (stats.total_rounds_taken_by_other_team_won/stats.total_rounds_taken_by_other_team)*100}/></td>
                <td><p>{stats.total_rounds_taken_by_other_team==0 ? 0 : Math.round((stats.total_rounds_taken_by_other_team_won/stats.total_rounds_taken_by_other_team)*100)}%</p></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br></br>
      <div className='div-stat'>
        <h3>Atouts</h3>
        <br></br>
        <div className='grid-stats-atouts'>
          <div className='sous-div-stat grid-stats-atouts-numbers'>
            <div>
              <p>Nombre moyen de cartes d'atout lors de la prise</p>
              <p>{stats.total_rounds==0 ? "-" : Math.round(stats.avg_nb_trump_cards_when_taken*10)/10}</p>
            </div>
            <div>
              <p>Carte d'atout préférée présente dans la main lors des prises d'atout</p>
              <p>{stats.trump_most_taken_card ? VALUE_DISPLAY[stats.trump_most_taken_card.value] : "-"}</p>
            </div>
          </div>
          
          {(Object.keys(SUIT_SYMBOLS)).map(s=>
            <div className='sous-div-stat sous-div-stat-stats-trump-colors' key={s}>
              <p style={{color: SUIT_SYMBOLS[s].color}}>{SUIT_SYMBOLS[s].symbol}</p>
              <p>Pris : {stats.total_rounds_taken==0 ? 0 : (stats.total_with_each_trump[s].total_taken/stats.total_rounds_taken)*100}%</p>
              <p>Victoires : {stats.total_with_each_trump[s].total_taken==0 ? 0 : (stats.total_with_each_trump[s].nb_victory/stats.total_with_each_trump[s].total_taken)*100}%</p>
            </div>
          )}
        </div>
      </div>
      <br></br>
      {stats.best_and_worst_players.best &&
        <div className='div-stat'>
          <h3>Partenaires</h3>
          <br></br>
          <div className='sous-div-stat-best-worst-players'>
            <div className='sous-div-stat sous-div-stat-players'>
              <p className='sous-div-stat-players-title'>Meilleur partenaire</p>
              <br></br>
              <p className='sous-div-stat-players-pseudo' onClick={()=>setOtherUserId(stats.best_and_worst_players.best.user_id)}>{stats.best_and_worst_players.best.pseudo}</p>
              <br></br>
              <p className='sous-div-stat-players-ratio'>{Math.round(stats.best_and_worst_players.best.ratio*1000)/10}%</p>
              <p>de victoires</p>
              <div className='sous-div-stat-players-counts'>
                <div>
                  <p>{stats.best_and_worst_players.best.nb_victory}</p>
                  <p>victoires</p>
                </div>
                <div>
                  <p>{stats.best_and_worst_players.best.nb_fail}</p>
                  <p>défaites</p>
                </div>
              </div>
            </div>
            <div className='sous-div-stat sous-div-stat-players'>
              <p className='sous-div-stat-players-title'>Pire partenaire</p>
              <br></br>
              <p className='sous-div-stat-players-pseudo' onClick={()=>setOtherUserId(stats.best_and_worst_players.worst.user_id)}>{stats.best_and_worst_players.worst.pseudo}</p>
              <br></br>
              <p className='sous-div-stat-players-ratio'>{Math.round(stats.best_and_worst_players.worst.ratio*1000)/10}%</p>
              <p>de victoires</p>
              <div className='sous-div-stat-players-counts'>
                <div>
                  <p>{stats.best_and_worst_players.worst.nb_victory}</p>
                  <p>victoires</p>
                </div>
                <div>
                  <p>{stats.best_and_worst_players.worst.nb_fail}</p>
                  <p>défaites</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </>
  );
}

