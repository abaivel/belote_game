import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../utils/api';
import "../styles/PlayersTeamDragAndDrop.css"

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
    <div className='div-players-team-drag-drop'>
        <DragDropContext onDragEnd={onDragEnd}>
        <div className='div-players-team-drag-drop-context'>
            
            {/* Rendu des deux listes */}
            {Object.keys(lists).map((listId, i) => (
            <div className='div-list-team-players' key={listId}>
                <p>Équipe {i+1}</p>
                <Droppable droppableId={listId}>
                {(provided) => (
                    <div className='div-players-team-droppable' ref={provided.innerRef} {...provided.droppableProps}>
                    {lists[listId].map((item, index) => (
                        <Draggable key={item.id} draggableId={"draggable"+item.id} index={index} isDragDisabled={!isDraggable}>
                        {(provided) => (
                            <div className='div-players-team-draggable'
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
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
            <button onClick={()=>setIsDraggable(true)} >
                Modifier les équipes
            </button>
        :
            <button disabled={lists[0].length>2 || lists[1].length>2} onClick={saveModifyTeams}>
                Enregistrer les équipes
            </button>
        }
    </div>
  );
};