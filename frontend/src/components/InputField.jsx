import { useState } from "react";
import "../styles/InputField.css"

export function InputField({ label, value, onChange, placeholder, type = 'text', onEnter }) {
  if (type=="password"){
    return <PasswordInputField label={label} value={value} onChange={onChange} placeholder={placeholder} onEnter={onEnter}/>
  }else{
    return (
      <div>
        <label className="label-input-field">
          {label.toUpperCase()}
        </label>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          className="input-field"
          onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.25)'}
        />
      </div>
    );
  }
}

function PasswordInputField({ label, value, onChange, placeholder, onEnter }){
  const [type, setType] = useState("password")

  function changeType(){
    if (type=="password"){
      setType("text")
    }else{
      setType("password")
    }
  }
  return (
    <div>
      <label className="label-input-field">
        {label.toUpperCase()}
      </label>
      <div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        className="input-field"
        onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.25)'}
      />
      <span className="material-symbols-outlined password-visibility-bt" onClick={changeType}>
        {type=="password" ? "visibility" : "visibility_off"}
      </span>
      </div>
    </div>
  );
}