import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../utils/api';

export function PlayersTeamDragAndDrop({players}){
  const [lists, setLists] = useState([[], []]);
  const [isDraggable, setIsDraggable] = useState(false)

 const onDragEnd = (result) => {
    const { source, destination } = result;

    // Si l'objet est lâché en dehors d'une zone valide
    if (!destination) return;

    // Si l'objet est lâché au même endroit qu'au départ
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    // Copie profonde de l'état actuel pour éviter les mutations directes
    const newLists = [ ...lists ];
    
    // On retire l'élément de la liste d'origine
    const [removed] = newLists[sourceListId].splice(source.index, 1);

    removed.team = parseInt(destination.droppableId) + 1;
    
    // On l'insère dans la liste de destination
    newLists[destListId].splice(destination.index, 0, removed);

    setLists(newLists);

  };

  useEffect(()=>{
    if (!isDraggable){
        let players_list = [[],[]]
        players.forEach(p => {
            players_list[p.team-1].push(p)
        });
        setLists(players_list)
    }
  }, [players])

  async function saveModifyTeams(){
    let listAllPlayers=[];
    lists.forEach((l,i)=>{
        l.forEach((p,j)=>{
            p.seat = 2*j+i;
            listAllPlayers.push(p);
            /*if (p.userId==myUserId){
                const saved = localStorage.getItem('belote_game');
                const game = JSON.parse(saved)
                game.mySeat = p.seat
                game.myTeam = p.team
                localStorage.setItem('belote_game', JSON.stringify(game))
            }*/
        })
    })
    try{
        await api.saveTeams(listAllPlayers);
    }catch (error){
        console.error(error);
    }
    setIsDraggable(false)
  }

  return (
    <div>
        <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: 10}}>
            
            {/* Rendu des deux listes */}
            {Object.keys(lists).map((listId, i) => (
            <div key={listId} style={{ flex: 1, padding: '12px 20px',borderRadius: 10, background: 'rgba(201, 168, 76, 0.1)', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
                <p style={{textWrap:'nowrap'}}>Équipe {i+1}</p>
                <Droppable droppableId={listId}>
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} style={{minHeight:70}}>
                    {lists[listId].map((item, index) => (
                        <Draggable key={item.id} draggableId={"draggable"+item.id} index={index} isDragDisabled={!isDraggable}>
                        {(provided) => (
                            <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                                fontFamily: 'Cinzel, serif',
                                fontSize: 11,
                                padding: '4px 10px',
                                borderRadius: 20,
                                background: 'rgb(218 218 218 / 15%)',
                                border: '1px solid rgb(255 255 255 / 50%)',
                                marginTop:10,
                                color: 'rgb(227 228 228)',
                                ...provided.draggableProps.style,
                            }}
                            >
                            {item.pseudo}
                            </div>
                        )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                    </div>
                )}
                </Droppable>
            </div>
            ))}
            
        </div>
        </DragDropContext>
        {!isDraggable ?
            <button onClick={()=>setIsDraggable(true)} style={{border: '1px solid rgba(201, 168, 76, 0.3)',
                                                                borderRadius: 8,
                                                                cursor: 'pointer',
                                                                fontFamily: 'Cinzel, serif',
                                                                letterSpacing: '0.1em',
                                                                transition: '0.2s',
                                                                whiteSpace: 'nowrap',
                                                                padding: '6px 14px',
                                                                fontSize: 11,
                                                                background: 'rgba(201, 168, 76, 0.15)',
                                                                color: 'rgb(201, 168, 76)'}}>
                Modifier les équipes
            </button>
        :
            <button disabled={lists[0].length>2 || lists[1].length>2} onClick={saveModifyTeams} style={{border: '1px solid rgba(201, 168, 76, 0.3)',
                                                                                                        borderRadius: 8,
                                                                                                        cursor: 'pointer',
                                                                                                        fontFamily: 'Cinzel, serif',
                                                                                                        letterSpacing: '0.1em',
                                                                                                        transition: '0.2s',
                                                                                                        whiteSpace: 'nowrap',
                                                                                                        padding: '6px 14px',
                                                                                                        fontSize: 11,
                                                                                                        background: 'rgba(201, 168, 76, 0.15)',
                                                                                                        color: 'rgb(201, 168, 76)'}}>
                Enregistrer les équipes
            </button>
        }
    </div>
  );
};