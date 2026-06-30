import { StatDisplay } from './StatDisplay.jsx';
import { ProgressBar } from './ProgressBar.jsx';

export function ProfileStats({stats}) {
 

  return (
    <>
      <div style={{display: "flex", gap:20}}>
        <StatDisplay value={stats.total_games} label="Nombre de parties jouées"/>
        <StatDisplay value={stats.total_games_won} label="Nombre de parties gagnées"/>
        <StatDisplay value={stats.total_games==0 ? "-" : (stats.total_games_won/stats.total_games)*100 + "%"} label="Pourcentage de victoire"/>
        
      </div>
      <br></br>
      <div className='div-stat'>
        <h4>Performances</h4>
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
    </>
  );
}


