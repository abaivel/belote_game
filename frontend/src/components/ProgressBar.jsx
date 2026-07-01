export function ProgressBar({value}){
    return (
    <div style={{height:20,width:'100%',backgroundColor:"lightgrey",borderRadius:20}}>
        <div style={{height:20,width:`${value}%`,backgroundColor:"#2d6a4f",borderRadius:20}}>
        </div>
    </div>);
}