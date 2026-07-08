const SUIT_SYMBOLS = {
  hearts:   { symbol: '♥', color: '#e61308' },
  diamonds: { symbol: '♦', color: '#e61308' },
  clubs:    { symbol: '♣', color: '#000' },
  spades:   { symbol: '♠', color: '#000' },
};

const VALUE_HEAD_NAMES = {
    'J': 'Jack',
    'Q': 'Queen',
    'K': 'King'
}

export function getCard(suit, value){
    if (value=='A'){
        return (<div className="div-content-card" style={{color: `${SUIT_SYMBOLS[suit].color}`, justifyContent:'center'}}>
				{SUIT_SYMBOLS[suit].symbol}
			</div>)
    }else if (value=='7' || value=='8'){
        let htmlElements = [];
        htmlElements.push(<div className="div-content-card" style={{ color: `${SUIT_SYMBOLS[suit].color}`,justifyContent: 'space-between'}} key="card_content_1">
                        <span>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span>{SUIT_SYMBOLS[suit].symbol}</span>
                    </div>)
        if (value=='7'){
            htmlElements.push(<div className="div-content-card" style={{ color: `${SUIT_SYMBOLS[suit].color}`,justifyContent: 'space-around'}} key="card_content_2">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span></span>
			</div>)
        }else{
            htmlElements.push(<div className="div-content-card" style={{ color: `${SUIT_SYMBOLS[suit].color}`,justifyContent: 'space-evenly'}} key="card_content_2">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        }
        htmlElements.push(<div className="div-content-card" style={{ color: `${SUIT_SYMBOLS[suit].color}`,justifyContent: 'space-between'}} key="card_content_3">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        return <>{htmlElements}</>
    }else if (value=='9' || value=='10'){
        let htmlElements = [];
        htmlElements.push(<div className="div-content-card" style={{color: `${SUIT_SYMBOLS[suit].color}`,justifyContent: 'space-between'}} key="card_content_1">
                        <span>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
                    </div>)
        if (value=='9'){
            htmlElements.push(<div className="div-content-card" style={{color: `${SUIT_SYMBOLS[suit].color}`,justifyContent: 'center', marginLeft: '-3px'}} key="card_content_2">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        }else{
            htmlElements.push(<div className="div-content-card" style={{color: `${SUIT_SYMBOLS[suit].color}`,justifyContent: 'space-around', marginLeft: '-3px'}} key="card_content_2">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        }
        htmlElements.push(<div className="div-content-card" style={{ color: `${SUIT_SYMBOLS[suit].color}`,justifyContent: 'space-between', marginLeft: '-3px'}} key="card_content_3">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
				<span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
				<span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        return <>{htmlElements}</>
    }else{
        return (<div className="div-content-card" style={{justifyContent: 'center'}}>
				<img src={"cards/svg/"+VALUE_HEAD_NAMES[value]+"_of_"+suit+".svg"}/>
			</div>)
    }
}