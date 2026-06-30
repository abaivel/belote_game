import { useEffect, useState } from "react";
import { InputField } from "./InputField.jsx";
import { api } from '../utils/api.js';

export function ModifyProfile({setNewPseudo, close}) {
  const [pseudo, setPseudo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess]     = useState(false);


  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      await api.changePseudo(pseudo)
      let user = localStorage.getItem("belote_user")
      if (user!=null){
        let userParsed = JSON.parse(user)
        userParsed.pseudo = pseudo
        localStorage.setItem("belote_user", JSON.stringify(userParsed))
      }
      setNewPseudo(pseudo)
      setSuccess(true)
      close()
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    let user = localStorage.getItem("belote_user")
    if (user!=null){
      let userParsed = JSON.parse(user)
      setPseudo(userParsed.pseudo)
    }
  }, [])

  return (
    <>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <InputField label="Pseudo" value={pseudo} onChange={setPseudo} placeholder="Votre pseudo" />
      </div>

      {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)',
            borderRadius: 8, color: '#e74c3c', fontSize: 13,
          }}>
            {error}
          </div>
        )}

      <button onClick={handleSubmit} disabled={loading}
        style={{
          width: '100%', marginTop: 24, padding: '14px 0',
          background: loading ? 'rgba(201,168,76,0.2)' : 'linear-gradient(135deg, #c9a84c, #e8c96d)',
          border: 'none', borderRadius: 8,
          color: loading ? '#c9a84c' : '#1a0a00',
          fontFamily: "'Cinzel', serif", fontSize: 14,
          letterSpacing: '0.15em', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(201,168,76,0.3)',
        }}>
        {loading ? '...' : 'Enregistrer'}
      </button>
      <button onClick={close} disabled={loading}
        style={{
          width: '100%', marginTop: 24, padding: '14px 0',
          background: loading ? 'rgba(201,168,76,0.2)' : 'linear-gradient(135deg, #c9a84c, #e8c96d)',
          border: 'none', borderRadius: 8,
          color: loading ? '#c9a84c' : '#1a0a00',
          fontFamily: "'Cinzel', serif", fontSize: 14,
          letterSpacing: '0.15em', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(201,168,76,0.3)',
        }}>
        Annuler
      </button>
      {success && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(43, 192, 50, 0.2)', border: '1px solid rgba(43, 192, 80, 0.4)',
            borderRadius: 8, color: '#3ce745', fontSize: 13,
          }}>
            Enregistrement réussi
          </div>
        )}

      
    </>
  );
}

