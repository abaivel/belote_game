import "../styles/DialogWindow.css"

export function DialogWindow({setOpen, children }) {

  return (
    <div className="dialog-window-overlay">
      <div className="dialog-window">
        <div className="dialog-window-div-close">
          <span className="material-symbols-outlined" onClick={()=>setOpen(false)}>
            close
          </span>
        </div>
        {children}

        
      </div>
    </div>
  );
}

