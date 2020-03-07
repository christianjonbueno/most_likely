import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import io from 'socket.io-client';
import Buttons from './Buttons';

const Game = () => {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [waitingOn, setWaitingOn] = useState('');
  const [ready, setReady] = useState(false);
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [score, setScore] = useState(0);
  const [winners, setWinners] = useState([]);
  const [host, setHost] = useState('');
  const [scoreboard, setScoreboard] = useState({});
  const [displayText, setDisplayText] = useState(true);
  const [displayPrompt, setDisplayPrompt] = useState(false);
  const [displayButtons, setDisplayButtons] = useState(false);
  const [displayWinners, setDisplayWinners] = useState(false);
  const instructions = 'How to play: Select the player you think best satisfies the prompt. If you believe you will be the most picked person, vote for yourself.'
  const endpoint = 'localhost:3500';

  const clickHandler = (event) => {
    // let socket = io(endpoint);
    let vote = event.target.value;
    console.log(vote);
    socket.emit('vote', { vote, name, room });
    socket.on('winner', ({ winners }) => {
      setWinners(winners);
      console.log(winners);
      setDisplayWinners(true);
      if (winners.indexOf(vote) !== -1 && vote === name) {
        setScore(score + 2);
      } else if (winners.indexOf(vote) !== -1) {
        setScore(score + 1);
      } else {
        setScore(score);

        socket.emit('update score', { score, name, room });
        socket.on('scoreboard', (scoreboard) => {
          setScoreboard(scoreboard);
        });
      }
    });

    if (name === host) {
      setReady(true);
    }
    setDisplayButtons(false);
  }

  useEffect(() => {
    let socket = io(endpoint);

    setTimeout(() =>  {
      socket.emit('update score', { score, name, room });
      socket.on('scoreboard', (scoreboard) => {
        setScoreboard(scoreboard);
      });

    })
  }, [score]);

  useEffect(() => {
    const { name, room } = queryString.parse(location.search);
    setRoom(room);
    setName(name);

    let socket = io(endpoint);

    socket.emit('wait', { name, room });
    socket.on('waiting on', ({ message, initialScore, host }) => {
      setWaitingOn(message);
      setScoreboard(initialScore);
      setHost(host);
    });

    socket.on('ready', ({ message, ready, players, initialScore, host }) => {
      setWaitingOn(message);
      setReady(ready);
      setPlayers(players);
      setScoreboard(initialScore);
      setHost(host);
    })
  }, []);

  useEffect(() => {

    let socket = io(endpoint)

    if (ready) {
      socket.emit('get prompt', { room, name });
      setReady(false);
    }

    socket.on('send prompt', ({ currentPrompt }) => {

      setCurrentPrompt(currentPrompt);
      setDisplayText(false);
      setDisplayPrompt(true);
      setDisplayButtons(true);
      setDisplayWinners(false);
    });
  }, [ready]);

  return (
    <div>
      <div>
        {displayText ? waitingOn : null}

      </div>
      <div>
        {displayText ? instructions : null}

      </div>
      <div>
        {displayPrompt ? currentPrompt : null}
        {displayButtons ? <Buttons players={players} clickHandler={clickHandler}></Buttons> : null}
        {displayWinners ? winners.map((winner) => {
          return (
            <div>{winner}</div>
          )
        }) : null }
        <h3>Scores</h3>
        <div className="AK-container-scoreboard">
          <ul className="AK-scoreboard">
            {Object.keys(scoreboard).map((player, key) => {
              return <li key={key}>{player}</li>
            })}
          </ul>
          <ul className="AK-scoreboard">
            {Object.values(scoreboard).map((value, key) => {
              return <li key={key}>{value}</li>
            })}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default Game;