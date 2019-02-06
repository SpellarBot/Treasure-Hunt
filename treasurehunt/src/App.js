import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios'
//ALL ALGORITHM + HELPER FUNCTIONALITIES TESTED 

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      traversalPath: [],
      backtracker: ['n'],
      visited: {0: {'n': '?', 's': '?', 'w': '?', 'e': '?'}},
      inverseDirections: {'n': 's', 's':'n', 'w':'e', 'e':'w'},
      currRoomInfo: null,
      authorization: {headers: {Authorization: 'Token ' + process.env.REACT_APP_AUTH}}
    }
  }

  
  componentDidMount () {
    axios 
    .get('https://lambda-treasure-hunt.herokuapp.com/api/adv/init/', this.state.authorization)
    .then(res => {
      this.setState({currRoomInfo: res.data})
      console.log(this.state.currRoomInfo)
    })
    .catch(err => {
      console.log(err)
    })
  }

  playerMove = (directionInfo) => {
    let directionParam = {direction: directionInfo}
      axios 
      .post('https://lambda-treasure-hunt.herokuapp.com/api/adv/move/', directionParam, this.state.authorization)
      .then(res => {
        this.setState({currRoomInfo: res.data})
        //localStorage.setItem('user-token', res.data);
      })
      .catch(err => {
        console.log(err)
      })
  }

  checkExits = (currRoomArr) => {
      let newArr = []
      for(var key in currRoomArr) {
        if(currRoomArr[key] === '?') {
          newArr.push(key)
        }
      }
      return newArr
  }

  //NOTE: Want to make server calls async

  newRoom = (roomID, prevroomID, direction) => {
    let temp = {} 
      // Builds the object for every exit possible. Base: {n: '?', s: '?', w: '?', e: '?'}
      this.state.currRoomInfo.exits.forEach(exit => { 
        temp[exit] = '?' 
      }); 
      // Gives the temps inverse value of the direction moved the value of the previous rooms id.
      temp[this.state.inverseDirections[direction]] = prevroomID 
      // Add the new object to the visited array
      this.setState({ visited: {...this.state.visited, [roomID] : temp}})
  }
  
    // = Meets JS standards
  travesalAlgorithm = () => {
    let {inverseDirections} = this.state
    while(this.state.visited.length !== 500) { 
      let currRoomID = this.state.currRoomInfo.room_id 
      let unexpExits = this.checkExits(this.state.visited[currRoomID])
      if(unexpExits.length > 0) {         
          let direction = unexpExits.pop() 
          let prevRoomID = currRoomID
          // Adds new direction to the traversalPath so we can track number of moves.
          this.setState({ traversalPath: [...this.state.traversalPath, direction] }) 
          // Adds inverse of direction to the array for simpler back tracking.
          this.setState({ backtracker: [...this.state.backtracker, inverseDirections[direction]] }) 
          // Attempts to move the player in the given direction.
          this.playerMove(direction)
          currRoomID = this.state.currRoomInfo.room_id
          // If the current room is not logged in visited it will be added.
          if(!this.state.visited[currRoomID]) { 
              this.newRoom(currRoomID, prevRoomID, direction);
          }
          // Should update the value of the direction travelled in the previous visited node 
          // to the value of the current room id.
          this.setState({visited: {...this.state.visited, prevRoomID: {...this.state.visited[prevRoomID], direction: currRoomID}}})
      } else {
           // NEED TO UPDATE
          let prevDir = this.state.backtracker
          prevDir = prevDir.splice(-1,1)[0]
          this.setState({ traversalPath: [...this.state.traversalPath, prevDir] })  // NEED TO UPDATE
          this.playerMove(prevDir) // Want to get this working with API
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
