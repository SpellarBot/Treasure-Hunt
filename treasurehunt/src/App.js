import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    this.props = props;
    this.state = {

    }
  }
  
    // = Meets JS standards
  travesalAlgorithm = () => {
    traversalPath = [] //
    backtracker = [] //
    visited = {0: {'n': '?', 's': '?', 'w': '?', 'e': '?'}}
    player.currentRoom = world.startingRoom
    inverseDirections = {'n': 's', 's':'n', 'w':'e', 'e':'w'}
    while(visited.length != 500) { //
      unexpExits = [] //
      allRooms = visited[player.currentRoom.id] //
      allRooms.forEach(exit => {   //
        if(allRooms[exit] == '?') {   //
            unexpExits.push(exit)  //
        };                              //
      });                             //
      if(unexpExits.length > 0) {         //
          direction = unexpExits.pop() //
          prevRoom = player.currentRoom.id //
          traversalPath.push(direction) //
          backtracker.push(inverseDirections[direction]) //
          player.travel(direction)  // Want to get this working with API
          if(player.currentRoom.id in visited) { //
              temp = {} //
              currExits = player.currentRoom.getExits() //
              currExits.forEach(exit => { //
                temp[exit] = '?'  //
              }); //
              temp[inverseDirections[direction]] = prevRoom //
              visited[player.currentRoom.id] = temp  //
          visited[prevRoom][direction] = player.currentRoom.id //
          } //
      } else {
          prevDir = backtracker.pop() //
          traversalPath.push(prevDir) //
          player.travel(prevDir) // Want to get this working with API
      }
    }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
