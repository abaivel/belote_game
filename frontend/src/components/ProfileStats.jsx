import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { StatDisplay } from './StatDisplay.jsx';

export function ProfileStats({userId}) {
  const [stats, setStats] = useState([])

  useEffect(()=> {
    async function fetchData() {
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
    fetchData();
  }, [])

  return (
    <>
      <div style={{display: "flex", gap:20}}>
        <StatDisplay value={stats.total_rounds} label="Nombre de tours joués"/>
        <StatDisplay value={stats.total_rounds_taken} label="Nombre de tours pris"/>
        <StatDisplay value={stats.total_rounds_taken_won} label="Nombre de tours pris et gagnés"/>
      </div>

      
    </>
  );
}


