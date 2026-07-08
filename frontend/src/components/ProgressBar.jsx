import "../styles/ProgressBar.css"

export function ProgressBar({value}){
    return (
    <div className="div-progress-bar">
        <div className="div-progress-bar-content" style={{width:`${value}%`}}>
        </div>
    </div>);
}