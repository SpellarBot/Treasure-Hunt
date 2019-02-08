/*
This file is for the map component to iterate through information provided 
from the stored graph/map creating the node and hallway components necessary
to visualize the map.
*/
import React from 'react';
import './map.css';


/*
Iterates through the provided map and returns the rooms along with
the hallways leading to the next rooms.
*/
const Map = (props) => {
    return (
        <div className ='mapDisplay'>
            {/*Iterates through the map and returns a room. The current
            room will be styled yellow.*/}
            {Object.keys(props.mapInfo).map((key, index) => {
                let styleNode = {
                    display: 'flex',
                    fontSize: '10px',
                    textAlign: 'center',
                    backgroundColor: 'grey',
                    height: '20px',
                    width: '20px',
                    position: 'absolute',
                    left: `${props.mapInfo[key]['x'] * 30 - 1200}px`,
                    top: `${props.mapInfo[key]['y'] * -30 + 2250}px`,
                    margin:'2px'
                };  

                if(props.currRoom == key) {
                    styleNode['backgroundColor'] = 'yellow'
                }   
                let item = key
                
                return (
                    <div>
                        <span className ='room' style={styleNode}>{key}</span>
                        {/* Creates hallways based on the room it is currently in, positioning the
                        hallways based on the directions available to that room. Returns hallways
                        associated with the room.*/}
                        {Object.keys(props.mapInfo[key]).map((key, index) => {
                            let edgeStyle = {
                                display:'flex',
                                height: '5px',
                                width: '5px',
                                backgroundColor: 'black',
                                position: 'absolute',
                                margin: '2px'
                            }
                            
                            if(key === 'n') {
                                edgeStyle['left'] = `${props.mapInfo[item]['x'] * 30 - 1193}px`
                                edgeStyle['top'] = `${props.mapInfo[item]['y'] * -30 + 2245}px`
                            }
                            
                            if(key === 's') {
                                edgeStyle['left'] = `${props.mapInfo[item]['x'] * 30 - 1193}px`
                                edgeStyle['top'] = `${props.mapInfo[item]['y'] * -30 + 2270}px`
                            }
                            
                            if(key === 'w') {
                                edgeStyle['left'] = `${props.mapInfo[item]['x'] * 30 - 1205}px`
                                edgeStyle['top'] = `${props.mapInfo[item]['y'] * -30 + 2257}px`
                            }
                            
                            if(key === 'e') {
                                edgeStyle['left'] = `${props.mapInfo[item]['x'] * 30 - 1180}px`
                                edgeStyle['top'] = `${props.mapInfo[item]['y'] * -30 + 2257}px`
                            }
                            return (
                                <span className ='hallway' style ={edgeStyle}></span>
                            )

                        })}
                        
                    </div>
                )   
            })}
        </div>
    );
}

export default Map;