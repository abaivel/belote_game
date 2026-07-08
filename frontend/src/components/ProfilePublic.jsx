import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { ProfileStats } from './ProfileStats.jsx';
import { StatDisplay } from './StatDisplay.jsx';
import { ModifyProfile } from './ModifyProfile.jsx';
import "../styles/ProfilePublic.css"

const PROFILES_TYPES = {
  "Stratège" : {description : "Peu de prises, très haut taux de réussite"},
  "Impitoyable" : {description : "Beaucoup de victoires avec des gros scores"},
  "Défenseur" : {description : "Excellent contre les preneurs"},
  "Pyromane" : {description : "Prend très souvent"},
  "Chanceux" : {description : "Gagne souvent avec peu de cartes d'atouts lors de la prise"},
  "Voleur" : {description : "Gagne souvent avec moins de 10 points de marge"}
}

export function ProfilePublic({userId, gameId, setNewPseudo}) {
  const [infosUser, setInfoUser] = useState([])
  const [stats, setStats] = useState([])
  const [isModifyProfileOpen, setIsModifyProfileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [otherUserId, setOtherUserId] = useState(null)
  const [previousOtherUsersId] = useState([])

  

  useEffect(()=> {
    async function fetchDataUser() {
      if (userId==null){
        let user = localStorage.getItem("belote_user")
          if (user!=null){
            let userParsed = JSON.parse(user)
            infosUser.pseudo = userParsed.pseudo
          }
      }else{
        try{
          const data = await api.getInfosUser(userId, gameId);
          setInfoUser(data.infos);
        } catch (error) {
          console.error(error)
        }
      }
    }
    async function fetchStats() {
      try{
        var data = [];
        if (userId == null){
          let user = localStorage.getItem("belote_user")
          if (user!=null){
            let userParsed = JSON.parse(user)
            data = await api.getStats(userParsed.id);
            setStats(data.stats);
          }
        }else{
          data = await api.getStats(userId);
          setStats(data.stats);
        }
        setLoading(false)
      } catch (error){
        console.error(error)
      }
    }
    async function fetchDataOtherUser() {
      try{
        const data = await api.getInfosUser(otherUserId, null);
        setInfoUser(data.infos);
      } catch (error) {
        console.error(error)
      }
    }
    async function fetchStatsOtherUser() {
      setLoading(true)
      try{
        let data = await api.getStats(otherUserId);
        setStats(data.stats);
        setLoading(false)
      } catch (error){
        console.error(error)
      }
    }
    if (otherUserId==null){
      fetchDataUser();
      fetchStats();
    }else{
      fetchDataOtherUser();
      fetchStatsOtherUser();
    }
  }, [otherUserId])

  function goBackToPreviousUser(){
    if (previousOtherUsersId.length>0){
      setOtherUserId(previousOtherUsersId.pop())
    }else{
      setOtherUserId(null)
    }
  }

    return (
        <div>
          {isModifyProfileOpen ?
              <ModifyProfile setNewPseudo={(p)=>{infosUser.pseudo=p;setNewPseudo(p);}} close={()=>setIsModifyProfileOpen(false)}/>
            :
            <>
            {otherUserId &&
              <div className='div-profile-public-arrow-back'>
                <span className="material-symbols-outlined" onClick={goBackToPreviousUser}>
                  arrow_back
                </span>
              </div>
            }
            <div className='div-profile-public-header'>
              <div className='div-profile-public-header-pseudo'>
                <p>{infosUser.pseudo}</p>
                {!userId && !otherUserId && 
                  <span className="material-symbols-outlined" onClick={()=>setIsModifyProfileOpen(true)}>
                    edit
                  </span>
                }
              </div>
              <div className='div-profile-public-header-personality-profile'>
                {stats.user_profil &&
                  <>
                    <img src={"personality_profiles/"+stats.user_profil+".svg"}/>
                    <p title={stats.user_profil && PROFILES_TYPES[stats.user_profil].description}>{stats.user_profil}</p>
                  </>
                }
              </div>
            </div>
            {gameId &&
            <div>
                {infosUser.is_connected 
                    ? 
                    <div className='div-profile-public-status-player'><span style={{ backgroundColor:"green" }}></span>Connecté(e)</div> 
                    : 
                    <div className='div-profile-public-status-player'><span style={{ backgroundColor:"red" }}></span>Déconnecté(e)</div>
                }
                <br></br>
                <h2>Statistiques de la partie en cours</h2>
                <br></br>
                <div className='div-player-game-stats'>
                    <StatDisplay value={infosUser.nb_rounds_taken} label="Nombre de tours pris"/>
                    <StatDisplay value={infosUser.nb_rounds_taken_won} label="Nombre de tours pris gagnés"/>
                </div>
            </div>}
            <br></br>
            <h2>Statistiques globales</h2>
            <br></br>
            {!loading && 
              <ProfileStats stats={stats} userId={userId} setOtherUserId={(id)=>{if (otherUserId!=null){previousOtherUsersId.push(otherUserId);}setOtherUserId(id);}}/>
            }
            </>
              }
        </div>
    )
}