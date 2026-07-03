const SUIT_SYMBOLS = {
  hearts:   { symbol: '♥', color: '#c0392b' },
  diamonds: { symbol: '♦', color: '#c0392b' },
  clubs:    { symbol: '♣', color: '#1a1a2e' },
  spades:   { symbol: '♠', color: '#1a1a2e' },
};

const VALUE_HEAD_NAMES = {
    'J': 'Jack',
    'Q': 'Queen',
    'K': 'King'
}

export function getCard(suit, value){
    if (value=='A'){
        return (<div className="div-content-card" style={{textAlign: 'center', color: `${SUIT_SYMBOLS[suit].color}`, alignContent: 'center', display: 'flex',flexDirection: 'column', justifyContent:'center'}}>
				{SUIT_SYMBOLS[suit].symbol}
			</div>)
    }else if (value=='7' || value=='8'){
        let htmlElements = [];
        htmlElements.push(<div className="div-content-card" style={{textAlign: 'center', color: `${SUIT_SYMBOLS[suit].color}`,alignContent: 'center', display: 'flex',flexDirection: 'column',justifyContent: 'space-between'}} key="card_content_1">
                        <span>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span>{SUIT_SYMBOLS[suit].symbol}</span>
                    </div>)
        if (value=='7'){
            htmlElements.push(<div className="div-content-card" style={{textAlign: 'center', color: `${SUIT_SYMBOLS[suit].color}`,alignContent: 'center', display: 'flex',flexDirection: 'column',justifyContent: 'space-around'}} key="card_content_2">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span></span>
			</div>)
        }else{
            htmlElements.push(<div className="div-content-card" style={{textAlign: 'center', color: `${SUIT_SYMBOLS[suit].color}`,alignContent: 'center', display: 'flex',flexDirection: 'column',justifyContent: 'space-evenly'}} key="card_content_2">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        }
        htmlElements.push(<div className="div-content-card" style={{textAlign: 'center', color: `${SUIT_SYMBOLS[suit].color}`,alignContent: 'center', display: 'flex',flexDirection: 'column',justifyContent: 'space-between'}} key="card_content_3">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        return <>{htmlElements}</>
    }else if (value=='9' || value=='10'){
        let htmlElements = [];
        htmlElements.push(<div className="div-content-card" style={{textAlign: 'center', color: `${SUIT_SYMBOLS[suit].color}`, alignContent: 'center', display: 'flex',flexDirection: 'column',justifyContent: 'space-between'}} key="card_content_1">
                        <span>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
                        <span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
                    </div>)
        if (value=='9'){
            htmlElements.push(<div className="div-content-card" style={{textAlign: 'center', color: `${SUIT_SYMBOLS[suit].color}`,alignContent: 'center', display: 'flex',flexDirection: 'column',justifyContent: 'center'}} key="card_content_2">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        }else{
            htmlElements.push(<div className="div-content-card" style={{textAlign: 'center', color: `${SUIT_SYMBOLS[suit].color}`,alignContent: 'center', display: 'flex',flexDirection: 'column',justifyContent: 'space-around'}} key="card_content_2">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        }
        htmlElements.push(<div className="div-content-card" style={{textAlign: 'center', color: `${SUIT_SYMBOLS[suit].color}`,alignContent: 'center', display: 'flex',flexDirection: 'column',justifyContent: 'space-between'}} key="card_content_3">
				<span>{SUIT_SYMBOLS[suit].symbol}</span>
				<span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
				<span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
				<span style={{marginTop: '-5px'}}>{SUIT_SYMBOLS[suit].symbol}</span>
			</div>)
        return <>{htmlElements}</>
    }else{
        return (<div className="div-content-card" style={{textAlign: 'center',alignContent: 'center', display: 'flex',flexDirection: 'column',justifyContent: 'space-between'}}>
				<img src={"cards/"+VALUE_HEAD_NAMES[value]+"_of_"+suit+".png"} style={{maxHeight: '100%', maxWidth: 56, marginLeft: '-8px', marginRight: '-8px'}}/>
			</div>)
    }
}