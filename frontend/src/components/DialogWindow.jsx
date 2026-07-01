export function DialogWindow({setOpen, children }) {

  return (
    <div style={{ position: 'absolute', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: "100vh", zIndex: 60, backgroundColor: "#ffffff6b"}}>
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(5,18,10,0.97)',
        border: '1px solid rgba(201,168,76,0.5)',
        borderRadius: 16,
        padding: '20px 28px',
        minWidth: 300,
        maxWidth: '80%',
        maxHeight: '80vh',
        overflowY: 'scroll',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        zIndex: 60,
      }}>
        <div style={{textAlign:"right", width: "100%"}}>
          <span className="material-symbols-outlined" style={{cursor: "pointer"}} onClick={()=>setOpen(false)}>
            close
          </span>
        </div>
        {children}

        
      </div>
    </div>
  );
}

