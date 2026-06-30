import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { ProfileStats } from './ProfileStats.jsx';
import { StatDisplay } from './StatDisplay.jsx';
import { ModifyProfile } from './ModifyProfile.jsx';

export function ProfilePublic({userId, gameId, setNewPseudo}) {
  const [infosUser, setInfoUser] = useState([])
  const [stats, setStats] = useState([])
  const [isModifyProfileOpen, setIsModifyProfileOpen] = useState(false)
    
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
          } catch (error){
            console.error(error)
          }
        }

        fetchDataUser();
        fetchStats();
      }, [])

    return (
        <>
          {isModifyProfileOpen ?
              <ModifyProfile setNewPseudo={(p)=>{infosUser.pseudo=p;setNewPseudo(p);}} close={()=>setIsModifyProfileOpen(false)}/>
            :
            <>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <p style={{textAlign:"left", fontSize: 30}}>{infosUser.pseudo}</p>
                {!userId && 
                  <span className="material-symbols-outlined" onClick={()=>setIsModifyProfileOpen(true)}>
                    edit
                  </span>
                }
              </div>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <p style={{fontSize: 20}}>{stats.user_profil}</p>
              </div>
            </div>
            {gameId &&
            <div>
                {infosUser.is_connected 
                    ? 
                    <div style={{textAlign:"left", display:"flex", alignItems:"center", gap:10}}><span style={{display:"block", width:7, height:7, backgroundColor:"green", borderRadius:50}}></span>Connecté(e)</div> 
                    : 
                    <div style={{textAlign:"left", display:"flex", alignItems:"center", gap:10}}><span style={{display:"block", width:7, height:7, backgroundColor:"red", borderRadius:50}}></span>Déconnecté(e)</div>
                }
                <br></br>
                <h4>Statistiques de la partie en cours</h4>
                <div style={{display: "flex", gap:20}}>
                    <StatDisplay value={infosUser.nb_rounds_taken} label="Nombre de tours pris"/>
                    <StatDisplay value={infosUser.nb_rounds_taken_won} label="Nombre de tours pris gagnés"/>
                </div>
            </div>}
            <br></br>
            <h4>Statistiques globales</h4>
            <ProfileStats stats={stats} userId={userId}/>
            </>
              }
        </>
    )
}