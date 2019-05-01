/*
This is the file that stores all functionality of the program.
It has a function for initializing api connection, automating movement,
calling the api for player movement, checking for unexplored rooms, creating
new rooms, stopping automation, and reseting the program information. Along
with the display components provided in the HUD.
*/

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios'
import Map from './Map'
import Status from './Status'
//ALL ALGORITHM + HELPER FUNCTIONALITIES TESTED  

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      traversalPath: [],
      backtracker: [],
      visited: {},
      inverseDirections: {'n': 's', 's':'n', 'w':'e', 'e':'w'},
      currRoomInfo: null,
      authorization: {headers: {Authorization: 'Token ' + process.env.REACT_APP_AUTH}},
      stopped: true,
      status: null,
      onCooldown: false,
      inputRoom: '',
    }
  }

  
  componentDidMount = async() => {
    await this.timeout(1000);
    this.init();
  }

  /*
  No arguments/returns. Initiates the program, checking local storage for 
  available information and sets state accoridngly. Attempts API call to 
  get information on starting point and sets state accordingly.
  */
  init = async() => {
    await this.updateStatus()
    axios 
    .get('https://lambda-treasure-hunt.herokuapp.com/api/adv/init/', this.state.authorization)
    .then(async(res) => {
      this.setState({currRoomInfo: res.data});
      let newroom = await this.newRoom(null, null);
      if(localStorage.getItem('map')) {
        let graph = await JSON.parse(localStorage.getItem('map'));
        this.setState({map: graph});
      } else {
        this.setState({map: {[this.state.currRoomInfo.room_id]: newroom}})
      }
      this.setState({ visited: {[this.state.currRoomInfo.room_id]: newroom}});
      this.setState({ backtracker: []});
      await this.timeout(this.state.currRoomInfo.cooldown * 1000);
    })
    .catch(err => {
      console.log(err);
    })
  }

  /* 
  Used to iterate through the map until you have explored all the rooms. Has no returns
  or arguments but does copy map information over to local storage as 'graph'.
  In the scenario of a a refresh, the visited rooms and the reverse of the travelled
  path are stored so the user can begin again where they left off.
  */
  automate = async() => {
    if(this.state.stopped) {
      await this.setState({stopped: false});
    }
    let {inverseDirections} = this.state;
    while(Object.keys(this.state.visited).length !== 500 & this.state.stopped === false) {  
      console.log(this.state.currRoomInfo);
      console.log(this.state.num_visited);
      let unexpExits = await this.checkExits(this.state.visited[this.state.currRoomInfo.room_id]);
      if(unexpExits.length > 0) {  
          let direction = unexpExits.pop() ;
          let prevRoomID = this.state.currRoomInfo.room_id; 
          // **Adds new direction to the traversalPath so we can track number of moves.
          this.setState({ traversalPath: [...this.state.traversalPath, direction]});
          // Adds inverse of direction to the array for simpler back tracking.
          this.setState({ backtracker: [...this.state.backtracker, inverseDirections[direction]]});
          if(this.state.currRoomInfo.items.length > 0) {
            await this.pickupTreasure();
          }
          if(this.state.currRoomInfo.title === 'Shop') {
            await this.sellTreasure();
          }
          // Attempts to move the player in the given direction.
          let info = await this.playerMove(direction);
          this.setState({currRoomInfo: info});
          if(!this.state.visited[this.state.currRoomInfo.room_id]) {
            let temp = await this.newRoom(prevRoomID, direction);
            this.setState({ visited: {...this.state.visited, [this.state.currRoomInfo.room_id]: temp}});
            if(!this.state.map[this.state.currRoomInfo.room_id]) {
              this.setState({ map: {...this.state.map, [this.state.currRoomInfo.room_id]: temp}});
            }
          }
            // Should update the value of the direction travelled in the previous visited node 
            // to the value of the current room id. If the current room is not logged in visited it will be added.
          this.setState({visited: {...this.state.visited, [prevRoomID]: {...this.state.visited[prevRoomID], [direction]: this.state.currRoomInfo.room_id}}});
          console.log(this.state.visited);
          this.setState({map: {...this.state.map, [prevRoomID]: {...this.state.visited[prevRoomID], [direction]: this.state.currRoomInfo.room_id}}});
          localStorage.setItem('map', JSON.stringify(this.state.map));
          await this.timeout((this.state.currRoomInfo.cooldown * 1000));
      } else {
          let prevDir = this.state.backtracker;
          prevDir = prevDir.splice(-1,1)[0];
          // **this.setState({ traversalPath: [...this.state.traversalPath, prevDir] })
          let info = await this.playerMove(prevDir); 
          this.setState({currRoomInfo: info});
          await this.timeout((this.state.currRoomInfo.cooldown * 1000));
      }
    }
    if(this.state.stopped === false) {
      await this.reset_handler();
      this.automate();
    }
  }

  chooseRoom = async(roomNum) => {
    //Check if stopped, if not stop any new actions.
    
    if(this.state.map[roomNum] && roomNum !== this.state.currRoomInfo.room_id) {
      if(this.state.stopped) {
        await this.setState({stopped: true});
      }
      console.log(this.state.currRoomInfo.room_id, roomNum)
      let shortestPath = await this.bfs(this.state.currRoomInfo.room_id, roomNum);
      while(shortestPath.length !== 0) {
        let nextMoveId = shortestPath.pop()
        let nextMoveDirection;
        console.log('NEXT MOVE',nextMoveId)
        for(let key in this.state.map[this.state.currRoomInfo.room_id]) {
          console.log(this.state.map[this.state.currRoomInfo.room_id][key])
          if(this.state.map[this.state.currRoomInfo.room_id][key] === nextMoveId) {
            nextMoveDirection = key;
            console.log('KEY',key)
            continue;
          }
        }
        await axios
        .post('https://lambda-treasure-hunt.herokuapp.com/api/adv/move/', {"direction": nextMoveDirection, "next_room_id": nextMoveId.toString()}, this.state.authorization)
        .then(async(res) => {
          this.setState({currRoomInfo: res.data});
          await this.timeout((res.data.cooldown) * 1000)
        })
        .catch(err => {
          console.log(err)
        })
      }
      
    } else if (typeof roomNum !== 'number' || roomNum > 499) {
      alert("That room does not exist")
    } else {
      alert("Room not discovered yet!")
    }
  }

  bfs = (sourceNum, roomNum) => {
    let {map} = this.state;
    let queue = [];
    let graph = {};
    for(let key in this.state.map) {
        graph[key] = {};
        graph[key].prev = null;
        graph[key].visited = false;
    }
    graph[sourceNum].visited = true;
    queue.push(sourceNum);
    while(queue.length !== 0 && graph[roomNum].visited === false) {
      let curr = queue.shift();
      for(let key in map[curr]) {
        let adjacentRoom = map[curr][key];
        if(typeof adjacentRoom !== 'string' && graph[adjacentRoom].visited === false) {
          graph[adjacentRoom].visited = true;
          graph[adjacentRoom].prev = parseInt(curr);
          queue.push(adjacentRoom);
        }
      }
    }
    let path = []
    let currentPos = roomNum;
    while(graph[currentPos].prev !== null) {
      path.push(currentPos);
      currentPos = graph[currentPos].prev;
    }
    console.log(path)
    return path;
  }

  pickupTreasure = async() => {
    console.log('TRIED')
    await axios
    .post('https://lambda-treasure-hunt.herokuapp.com/api/adv/take/', {"name": this.state.currRoomInfo.items[0]}, this.state.authorization)
    .then(async(res) => {
      await this.timeout((res.data.cooldown) * 1000)
      await this.updateStatus()
    })
    .catch(err => {
      console.log(err)
    })
  }

  sellTreasure = async() => {
    this.state.status.inventory.map(async(item) => {
      await axios
      .post('https://lambda-treasure-hunt.herokuapp.com/api/adv/sell/', {"name": item}, this.state.authorization)
      .then(async(res) => {
        await this.timeout((res.data.cooldown) * 1000)
        await this.updateStatus()
      })
      .catch(err => {
        console.log(err)
      })
    })
    
  }

  updateStatus = async() => {
    await axios
    .post('https://lambda-treasure-hunt.herokuapp.com/api/adv/status/', {},this.state.authorization)
    .then(async(res) => {
      this.setState({status: res.data})
      await this.timeout(this.state.status.cooldown * 1000)
    })
    .catch(err => {
      console.log(err)
    })
  }

  dropItem = async (ev) => {
    ev.preventDefault()
    ev.persist()
    this.stop_handler()
    await this.timeout(this.state.currRoomInfo.cooldown * 1000)
    await axios
    .post('https://lambda-treasure-hunt.herokuapp.com/api/adv/drop/', {"name": ev.target.name}, this.state.authorization)
    .then(async(res) => {
      await this.timeout((res.data.cooldown) * 1000)
      this.updateStatus()
    })
  }

  /*
  Takes the direction as an argument. Attempts to move according to that direction
  through an api call. Then returns response data which holds information on another
  room.
  */
  playerMove = async (directionInfo) => {
    const test = await axios 
    .post('https://lambda-treasure-hunt.herokuapp.com/api/adv/move/', {'direction': directionInfo}, this.state.authorization)
    .then(res => {
      return res.data
    })
    .catch(err => {
      return null
    })
    return await test
  }

  /*
  Takes the currRoomExits object as an argument. Iterates through the
  currRoomExits to find rooms which are unexplored and returns the newly
  created array of unexplored directions.
  */
  checkExits = (currRoomExits) => {
      let newArr = []
      for(var key in currRoomExits) {
        if(currRoomExits[key] === '?') {
          newArr.push(key)
        }
      }
      return newArr
  }

  /*
  Takes prevroomID and direction as arguments. Creates a new object with a key
  value per exit in the current room, along with the coordinates for that room.
  If prevroomID is provided it will set inverse of the associated key equal to
  the old room id. Then returns temp.
  */
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
    return temp
  }

  /*
  Takes in ms(milliseconds) as an argument. Returns a response to allow
  the one who called it to know that the specified amount of time has passed.
  */
  timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handle_move_click = async(ev) => {
    let {inverseDirections} = this.state;
    let prevRoomID = this.state.currRoomInfo.room_id;
    let direction = ev.target.name;
    this.setState({ backtracker: [...this.state.backtracker, inverseDirections[direction]]});
    let newRoom = await this.playerMove(direction);
    if(newRoom != null) {
      this.setState({currRoomInfo: newRoom});
      if(!this.state.visited[this.state.currRoomInfo.room_id]) {
        let temp = await this.newRoom(prevRoomID, direction);
        this.setState({ visited: {...this.state.visited, [this.state.currRoomInfo.room_id]: temp}});
        if(!this.state.map[this.state.currRoomInfo.room_id]) {
          this.setState({ map: {...this.state.map, [this.state.currRoomInfo.room_id]: temp}});
        }
      }
        // Should update the value of the direction travelled in the previous visited node 
        // to the value of the current room id. If the current room is not logged in visited it will be added.
      this.setState({visited: {...this.state.visited, [prevRoomID]: {...this.state.visited[prevRoomID], [direction]: this.state.currRoomInfo.room_id}}});
      await this.setState({map: {...this.state.map, [prevRoomID]: {...this.state.map[prevRoomID], [direction]: this.state.currRoomInfo.room_id}}});
      localStorage.setItem('map', JSON.stringify(this.state.map));
      this.setState({onCooldown: true})
      setTimeout(function() {
        this.setState({onCooldown: false})
      }.bind(this), (this.state.currRoomInfo.cooldown * 1000)); 
  } else {
    alert('Unable to move in that direction')
  }
}

  /*
  No arguments/returns. Just calls the automate function.
  */
  auto_handler =() => {
    this.automate()
  }

  /*
  No arguments/returns. Removes the local storage for visited/backtracker.
  Resets state for backtracker and visited for a fresh start, allowing the
  user to explore all 500 rooms again.
  */
  reset_handler = async() => {
    let newroom = await this.newRoom(null, null)
    this.setState({ visited: {[this.state.currRoomInfo.room_id]: newroom}})
    this.setState({backtracker: []})
  }
  
  /*
  No arguments/returns. Sets state of stopped to true in order to prevent 
  the automate function from iteration further.
  */
  stop_handler = () => {
    this.setState({stopped: true})
  }
  
  render() {
    let generating;
    if(this.state.map!= null & this.state.currRoomInfo != null) {
      generating = <Map mapInfo = {this.state.map} currRoom = {this.state.currRoomInfo.room_id}/>
    } else {
      generating = <h1>Generating Map</h1>
    }
    let auto;
    if(this.state.stopped === true) {
      auto = <div>
                  <button onClick={this.auto_handler}>Auto</button>
            </div>
    } else {
      auto = <button onClick={this.stop_handler}>Stop</button>
    }

    let currRoom;
    if(this.state.currRoomInfo) {
      currRoom = <h1>Room: {this.state.currRoomInfo.room_id}</h1>
    } else {
      currRoom = <h1>Room:</h1>
    }

    let status;
    if(this.state.status != null) {
      status = <Status statusInfo = {this.state.status} dropItem = {this.dropItem} stopped = {this.state.stopped}/>
    } else {
      status = <h1>Retrieving Status</h1>
    }
    let movement;
    if(this.state.onCooldown === true) {
     movement = <h2>Movement on cooldown</h2>
    } else {
      movement = <div className='movement-buttons'>
                  <button className= 'n' onClick={this.handle_move_click} name='n'>N</button>
                  <button className= 'w' onClick={this.handle_move_click} name='w'>W</button>
                  <button className= 'e' onClick={this.handle_move_click} name='e'>E</button>
                  <button className= 's' onClick={this.handle_move_click} name='s'>S</button>
                </div>
    }

    return (
      <div className="App">
        {generating}
        <div className='HUD'>
          {currRoom}
          {movement}
          <div>
            <h2>Travel to Room:</h2>
            <input placeholder="Room ID" onChange={(ev) => {
                console.log(ev.target.value)
                this.setState({roomInput: parseInt(ev.target.value)});
            }}/>
            <button onClick={() => {
              this.chooseRoom(this.state.roomInput);
            }}>Move</button>
          </div>
          <div className='extra-buttons'>
            {auto}
            
            
          </div>
          {status}
        </div>
      </div>

    );
  }
}

export default App;
