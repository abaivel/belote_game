import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { ProfileStats } from './ProfileStats.jsx';
import { StatDisplay } from './StatDisplay.jsx';

export function ProfilePublic({userId, gameId}) {
    const [infosUser, setInfoUser] = useState([])
    
      useEffect(()=> {
        async function fetchData() {
          try{
            const data = await api.getInfosUser(userId, gameId);
            setInfoUser(data.infos);
          } catch (error) {
            console.error(error)
          }
        }
        fetchData();
      }, [])

    return (
        <>
            <p style={{textAlign:"left", fontSize: 30}}>{infosUser.pseudo}</p>
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
            <ProfileStats userId={userId}/>
        </>
    )
}