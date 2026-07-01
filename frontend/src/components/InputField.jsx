import { useState } from "react";

export function InputField({ label, value, onChange, placeholder, type = 'text', onEnter }) {
  if (type=="password"){
    return <PasswordInputField label={label} value={value} onChange={onChange} placeholder={placeholder} onEnter={onEnter}/>
  }else{
    return (
      <div>
        <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(245,234,213,0.6)', marginBottom: 6, fontFamily: "'Cinzel', serif", textAlign:"left" }}>
          {label.toUpperCase()}
        </label>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          style={{
            width: '100%', padding: '11px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 8, outline: 'none',
            color: '#f5ead5', fontSize: 15,
            fontFamily: "'Crimson Pro', serif",
            transition: 'border-color 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.7)'}
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
      <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(245,234,213,0.6)', marginBottom: 6, fontFamily: "'Cinzel', serif", textAlign:"left" }}>
        {label.toUpperCase()}
      </label>
      <div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        style={{
          width: '100%', padding: '11px 40px 11px 14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 8, outline: 'none',
          color: '#f5ead5', fontSize: 15,
          fontFamily: "'Crimson Pro', serif",
          transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.7)'}
        onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.25)'}
      />
      <span className="material-symbols-outlined" style={{color:"#2d6a4f", position:"relative", top: "-32px", left: "calc(100% - 33px)", cursor: "pointer"}} onClick={changeType}>
        {type=="password" ? "visibility" : "visibility_off"}
      </span>
      </div>
    </div>
  );
}