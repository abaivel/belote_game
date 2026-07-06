import { StatDisplay } from './StatDisplay.jsx';
import { ProgressBar } from './ProgressBar.jsx';

const SUIT_SYMBOLS = {
  hearts:   { symbol: '♥', color: '#c0392b' },
  diamonds: { symbol: '♦', color: '#c0392b' },
  clubs:    { symbol: '♣', color: '#1a1a2e' },
  spades:   { symbol: '♠', color: '#1a1a2e' },
};

export function ProfileStats({stats, setOtherUserId}) {

  return (
    <>
      <div className='div-stats-line' style={{display: "flex", gap:20, justifyContent:'space-between'}}>
        <StatDisplay value={stats.total_games} label="Nombre de parties jouées"/>
        <StatDisplay value={stats.total_games_won} label="Nombre de parties gagnées"/>
        <StatDisplay value={stats.total_games==0 ? "-" : (stats.total_games_won/stats.total_games)*100 + "%"} label="Pourcentage de victoire"/>
      </div>
      <br></br>
      <div className='div-stat'>
        <h3 style={{textAlign:"left", fontSize:20}}>Performances</h3>
        <div>
          <table style={{width:"100%"}}>
            <tbody>
              <tr>
                <td style={{width:'30%', textAlign:'left'}}><p>Tours pris</p></td>
                <td style={{width:'60%'}}><ProgressBar value={stats.total_rounds==0 ? 0 : (stats.total_rounds_taken/stats.total_rounds)*100}/></td>
                <td style={{width:'10%'}}><p>{stats.total_rounds==0 ? 0 : Math.round((stats.total_rounds_taken/stats.total_rounds)*100)}%</p></td>
              </tr>
              <tr>
                <td style={{width:'30%', textAlign:'left'}}><p>Tours gagnés</p></td>
                <td style={{width:'60%'}}><ProgressBar value={stats.total_rounds_taken==0 ? 0 : (stats.total_rounds_taken_won/stats.total_rounds_taken)*100}/></td>
                <td style={{width:'10%'}}><p>{stats.total_rounds_taken==0 ? 0 : Math.round((stats.total_rounds_taken_won/stats.total_rounds_taken)*100)}%</p></td>
              </tr>
              <tr>
                <td style={{width:'30%', textAlign:'left'}}><p>Tours défendus</p></td>
                <td style={{width:'60%'}}><ProgressBar value={stats.total_rounds_taken_by_other_team==0 ? 0 : (stats.total_rounds_taken_by_other_team_won/stats.total_rounds_taken_by_other_team)*100}/></td>
                <td style={{width:'10%'}}><p>{stats.total_rounds_taken_by_other_team==0 ? 0 : Math.round((stats.total_rounds_taken_by_other_team_won/stats.total_rounds_taken_by_other_team)*100)}%</p></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br></br>
      <div className='div-stat'>
        <h3 style={{textAlign:"left", fontSize:20}}>Atouts</h3>
        <br></br>
        <div className='grid-stats-atouts'>
          <div className='sous-div-stat grid-stats-atouts-numbers'>
            <div style={{display:"flex", flexDirection:'column', justifyContent:'space-around'}}>
              <p>Nombre moyen de cartes d'atout lors de la prise</p>
              <p style={{fontSize:30}}>{stats.total_rounds==0 ? "-" : Math.round(stats.avg_nb_trump_cards_when_taken*10)/10}</p>
            </div>
            <div>
              <p>Carte d'atout préférée présente dans la main lors des prises d'atout</p>
              <p style={{fontSize:30}}>{stats.trump_most_taken_card ? stats.trump_most_taken_card.value : "-"}</p>
            </div>
          </div>
          
          {(Object.keys(SUIT_SYMBOLS)).map(s=>
            <div className='sous-div-stat' key={s}>
              <p style={{fontSize:50, color: SUIT_SYMBOLS[s].color}}>{SUIT_SYMBOLS[s].symbol}</p>
              <p>Pris : {stats.total_rounds_taken==0 ? 0 : (stats.total_with_each_trump[s].total_taken/stats.total_rounds_taken)*100}%</p>
              <p>Victoires : {stats.total_with_each_trump[s].total_taken==0 ? 0 : (stats.total_with_each_trump[s].nb_victory/stats.total_with_each_trump[s].total_taken)*100}%</p>
            </div>
          )}
        </div>
      </div>
      <br></br>
      {stats.best_and_worst_players.best &&
        <div className='div-stat'>
          <h3 style={{textAlign:"left", fontSize:20}}>Partenaires</h3>
          <br></br>
          <div style={{display: "flex", justifyContent: 'space-around'}}>
            <div className='sous-div-stat' style={{width:200}}>
              <p style={{fontSize:20}}>Meilleur partenaire</p>
              <br></br>
              <p style={{fontSize:35}} onClick={()=>setOtherUserId(stats.best_and_worst_players.best.user_id)}>{stats.best_and_worst_players.best.pseudo}</p>
              <br></br>
              <p style={{fontSize:25}}>{Math.round(stats.best_and_worst_players.best.ratio*1000)/10}%</p>
              <p>de victoires</p>
              <div style={{display:"flex", justifyContent: 'space-around'}}>
                <div>
                  <p style={{fontSize:25}}>{stats.best_and_worst_players.best.nb_victory}</p>
                  <p>victoires</p>
                </div>
                <div>
                  <p style={{fontSize:25}}>{stats.best_and_worst_players.best.nb_fail}</p>
                  <p>défaites</p>
                </div>
              </div>
            </div>
            <div className='sous-div-stat' style={{width:200}}>
              <p style={{fontSize:20}}>Pire partenaire</p>
              <br></br>
              <p style={{fontSize:35}} onClick={()=>setOtherUserId(stats.best_and_worst_players.worst.user_id)}>{stats.best_and_worst_players.worst.pseudo}</p>
              <br></br>
              <p style={{fontSize:25}}>{Math.round(stats.best_and_worst_players.worst.ratio*1000)/10}%</p>
              <p>de victoires</p>
              <div style={{display:"flex", justifyContent: 'space-around'}}>
                <div>
                  <p style={{fontSize:25}}>{stats.best_and_worst_players.worst.nb_victory}</p>
                  <p>victoires</p>
                </div>
                <div>
                  <p style={{fontSize:25}}>{stats.best_and_worst_players.worst.nb_fail}</p>
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

