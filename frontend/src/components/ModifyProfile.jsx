import { useEffect, useState } from "react";
import { InputField } from "./InputField.jsx";
import { api } from '../utils/api.js';
import "../styles/ModifyProfile.css"

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

      <div className="div-input-change-pseudo">
        <InputField label="Pseudo" value={pseudo} onChange={setPseudo} placeholder="Votre pseudo" />
      </div>

      {error && (
          <div className="div-return-message-change-pseudo div-error-change-pseudo">
            {error}
          </div>
        )}

      <button onClick={handleSubmit} disabled={loading} className="button-change-pseudo">
        {loading ? '...' : 'Enregistrer'}
      </button>
      <button onClick={close} disabled={loading} className="button-change-pseudo">
        Annuler
      </button>
      {success && (
          <div className="div-return-message-change-pseudo div-success-change-pseudo">
            Enregistrement réussi
          </div>
        )}

      
    </>
  );
}

