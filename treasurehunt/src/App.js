import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios'
import Map from './Map'
//ALL ALGORITHM + HELPER FUNCTIONALITIES TESTED  

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      traversalPath: [],
      backtracker: [],
      map: null, //WILL STORE WHATEVER LOCAL STORAGE RETURNS
      visited: {},
      inverseDirections: {'n': 's', 's':'n', 'w':'e', 'e':'w'},
      currRoomInfo: null,
      authorization: {headers: {Authorization: 'Token ' + process.env.REACT_APP_AUTH}},
      num_visited: 0,
      stopped: false,

    }
  }

  
  componentDidMount = async() => {
    this.init()
  }

  init = async() => {
    if(localStorage.getItem('graph')) {
      let graph = await JSON.parse(localStorage.getItem('graph'))
      this.setState({map: graph})
    }
    axios 
    .get('https://lambda-treasure-hunt.herokuapp.com/api/adv/init/', this.state.authorization)
    .then(async(res) => {
      this.setState({currRoomInfo: res.data})
      let newroom = await this.newRoom(null, null)
      this.setState({ visited: {...this.state.visited, [this.state.currRoomInfo.room_id]: newroom}})
      await this.timeout(this.state.currRoomInfo.cooldown * 1000)
      console.log(this.state.currRoomInfo)
      if(localStorage.getItem('visited')) {
        let visitedInfo = await JSON.parse(localStorage.getItem('visited'))
        this.setState({visited: visitedInfo})
      }
      if(localStorage.getItem('backtracker')) {
        let backtrackerInfo = await JSON.parse(localStorage.getItem('backtracker'))
        this.setState({backtracker: backtrackerInfo})
      }
    })
    .catch(err => {
      console.log(err)
    })
  }

  automate = async() => {
    //I want to explore similar to the other traversal except this time I want 
    // to add the wise explorer function to make it faster
    await this.setState({stopped: false})
    let {inverseDirections} = this.state
    while(Object.keys(this.state.visited).length !== 500 & this.state.stopped === false) {  
      console.log(this.state.visited)
      let unexpExits = this.checkExits(this.state.visited[this.state.currRoomInfo.room_id])
      if(unexpExits.length > 0) {         
          let direction = unexpExits.pop() 
          let prevRoomID = this.state.currRoomInfo.room_id
          // **Adds new direction to the traversalPath so we can track number of moves.
          this.setState({ traversalPath: [...this.state.traversalPath, direction] }) 
          // Adds inverse of direction to the array for simpler back tracking.
          this.setState({ backtracker: [...this.state.backtracker, inverseDirections[direction]] }) 
          // Attempts to move the player in the given direction.
          let info = await this.playerMove(direction)
          this.setState({currRoomInfo: info})
          if(!this.state.visited[this.state.currRoomInfo.room_id]) {
            let temp = await this.newRoom(prevRoomID, direction);
            this.setState({ visited: {...this.state.visited, [this.state.currRoomInfo.room_id]: temp}})
          }
            // Should update the value of the direction travelled in the previous visited node 
            // to the value of the current room id. If the current room is not logged in visited it will be added.
          this.setState({visited: {...this.state.visited, [prevRoomID]: {...this.state.visited[prevRoomID], [direction]: this.state.currRoomInfo.room_id}}})
          await this.timeout((this.state.currRoomInfo.cooldown * 1000)) 
      } else {
        console.log('ERROR')
          let prevDir = this.state.backtracker
          prevDir = prevDir.splice(-1,1)[0]
          // **this.setState({ traversalPath: [...this.state.traversalPath, prevDir] })
          let info = await this.playerMove(prevDir)
          this.setState({currRoomInfo: info})
          await this.timeout((this.state.currRoomInfo.cooldown * 1000))   
      }
      localStorage.setItem('backtracker', JSON.stringify(this.state.backtracker))
      localStorage.setItem('visited', JSON.stringify(this.state.visited));
    }
    if(this.state.stopped === false) {
      localStorage.setItem('graph', JSON.stringify(this.state.visited))
    }
  }

  playerMove = async (directionInfo) => {
    const test = await axios 
    .post('https://lambda-treasure-hunt.herokuapp.com/api/adv/move/', {'direction': directionInfo}, this.state.authorization)
    .then(res => {
      return res.data
    })
    .catch(err => {
      console.log(err)
    })
    return await test
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

  newRoom = async (prevroomID, direction) => {
    let tempList = this.state.currRoomInfo.exits
    let temp = {} 
    // Builds the object for every exit possible. Base: {n: '?', s: '?', w: '?', e: '?'}
    tempList.forEach(exit => { 
      temp[exit] = '?' 
    });
    var xy = this.state.currRoomInfo.coordinates.replace(/[{()}]/g, '').split(',');
    temp['x'] = xy[0]
    temp['y'] = xy[1]
    if(prevroomID != null) {
    // Gives the temps inverse value of the direction moved the value of the previous rooms id.
      temp[this.state.inverseDirections[direction]] = prevroomID 
    }
    return await temp
  }

  timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handle_move_click = (ev) => {
    console.log(ev.target.name)
  }

  auto_handler =() => {
    this.automate()
  }

  reset_handler = async() => {
    localStorage.removeItem('visited')
    localStorage.removeItem('backtracker')
    let newroom = await this.newRoom(null, null)
    this.setState({ visited: {...this.state.visited, [this.state.currRoomInfo.room_id]: newroom}})
    this.setState({backtracker: []})
  }
  
  stop_handler = () => {
    this.setState({stopped: true})
  }
  
  render() {
    let generating;
    if(this.state.map != null & this.state.currRoomInfo != null) {
      generating = <Map mapInfo = {this.state.map} currRoom = {this.state.currRoomInfo.room_id}/>
    } else {
      generating = <h1>Generating Map</h1>
    }
    let currRoom;
    if(this.state.currRoomInfo) {
      currRoom = <h1>Room ID: {this.state.currRoomInfo.room_id}</h1>
    } else {
      currRoom = <h1>Room ID:</h1>
    }
    return (
      <div className="App">
        {generating}
        <div className='HUD'>
          {currRoom}
          <div className='movement-buttons'>
            <button className= 'n' onClick={this.handle_move_click} name='n'>N</button>
            <button className= 'w' onClick={this.handle_move_click} name='w'>W</button>
            <button className= 'e' onClick={this.handle_move_click} name='e'>E</button>
            <button className= 's' onClick={this.handle_move_click} name='s'>S</button>
            
          </div>
          <div className='extra-buttons'>
            <button onClick={this.auto_handler}>Auto</button>
            <button onClick={this.reset_handler}>Reset</button>
            <button onClick={this.stop_handler}>Stop</button>
          </div>
        </div>
      </div>

    );
  }
}

export default App;
