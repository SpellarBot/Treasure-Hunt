/*

*/
import React from 'react';
import './status.css';


/*
*/
const Status = (props) => {
    
    return (
        <div className ='statusDisplay'>
            <h2>Name: {props.statusInfo.name}</h2>
            <h3>Speed: {props.statusInfo.speed}</h3>
            <h3>Strength: {props.statusInfo.strength}</h3>
            <h3>Encumbrance: {props.statusInfo.encumbrance}</h3>
            <h3>Gold: {props.statusInfo.gold}</h3>
            <h3>Inventory:</h3>
            {props.statusInfo.inventory.map(item => {
                let dropButtons
                if(props.stopped === true) {
                    dropButtons = <button name = {item} onClick={props.dropItem}>DROP</button>
                }
                return (
                    <div className = 'ItemDisplay'>
                        <p>{item}</p>
                        {dropButtons}
                    </div>
                )
            })}
            
           {console.log(props.statusInfo)}
        </div>
    );
}

export default Status;