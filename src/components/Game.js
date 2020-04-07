import React, { useState } from 'react';
import axios from 'axios';

import Board from './Board';

// API related
const API_ENDPOINT = 'https://sugoku.herokuapp.com';
const encodeBoard = (board) => board.reduce((result, row, i) => result + `%5B${encodeURIComponent(row)}%5D${i === board.length -1 ? '' : '%2C'}`, '');
const encodeParams = (params) =>
  Object.keys(params).map(
    key => key + `=%5B${encodeBoard(params[key])}%5D`
  ).join('&');

// Custom hook for saving data
const useSemiPersistentState = (key, initialState) => {
  let storedState;

  try {
    storedState = JSON.parse(localStorage.getItem(key));
  } catch {
    storedState = null;
  }

  const [value, setValue] = React.useState(storedState || initialState);

  React.useEffect(
    () => { localStorage.setItem(key, JSON.stringify(value)); },
    [key, value]
  );
  return [value, setValue];
};

// Reducer for square focus management
const squareFocusReducer = (state, action) => {
  switch (action.type) {
    case 'FOCUS_ON_EMPTY':
      return {
        ...state,
        onFocus: null,
        sameAsFocused: [],
        errors: [],
      };

    case 'FOCUS_ON_VALID':
      return {
        ...state,
        onFocus: action.payload.onFocus,
        sameAsFocused: action.payload.sameAsFocused,
        errors: [],
      };

    case 'FOCUS_ON_ERROR':
      return {
        ...state,
        onFocus: null,
        sameAsFocused: [],
        errors: action.payload,
      };

    default:
      throw new Error();
  }
};

export default function Game() {

  const [squares, setSquares] = useSemiPersistentState(
    'sudoku-grid',
    [
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
    ]
  );
  const [focus, dispatchFocus] = React.useReducer(
    squareFocusReducer,
    { onFocus: null, sameAsFocused: [], errors: [] }
  );
  const [status, setStatus] = useState('unsolved');
  const [difficulty, setDifficulty] = useSemiPersistentState(
    'sudoku-difficulty',
    'easy'
  );

  const getSquareNeighbours = (i, j) => {
    let neighbours = [];

    // Line and column neighbours
    for (let x = 0; x < 9; x++) {
      neighbours.push({ i: i, j: x });
      neighbours.push({ i: x, j: j })
    }

    // Matrix neighbours
    const buildMatrixNeighbours = x => {
      switch(x % 3) {
        case 0:
          return [x + 1, x + 2];
        case 1:
          return [x - 1, x + 1];
        default:
          return [x - 1, x - 2];
      }
    };
    const [i1, i2] = buildMatrixNeighbours(i);
    const [j1, j2] = buildMatrixNeighbours(j);

    return [
      ...neighbours,
      { i: i1, j: j1 },
      { i: i1, j: j2 },
      { i: i2, j: j1 },
      { i: i2, j: j2 },
    ];
  };

  const handleSquareChange = (i, j) => value => {
    let newSquares = squares.slice();

    newSquares[i][j] = value;
    setSquares(newSquares);
    handleSquareFocus(i, j)(value);
  };

  const handleSquareFocus = (i, j) => value => {
    // The focused square is empty
    if (!value) {
      dispatchFocus({ type: 'FOCUS_ON_EMPTY' });
      return;
    }

    const neighbours = getSquareNeighbours(i, j);
    const sameNeighboursPositions = neighbours.filter(neighbourPosition =>
      (neighbourPosition.i !== i || neighbourPosition.j !== j) &&
      squares[neighbourPosition.i][neighbourPosition.j] === value
    );

    // The focused square has same value neighbours
    if (sameNeighboursPositions.length !== 0) {
      dispatchFocus({
        type: 'FOCUS_ON_ERROR',
        payload: [...sameNeighboursPositions, { i: i, j: j }]
      });
      return;
    }

    let sameAsFocused = [];
    for (let x = 0; x < squares.length; x++) {
      for (let y = 0; y < squares[x].length; y++) {
        if ((x !== i || y !== j) && squares[x][y] === value) {
          sameAsFocused.push({
            i: x,
            j: y,
          });
        }
      }
    }

    dispatchFocus({
      type: 'FOCUS_ON_VALID',
      payload: {
        onFocus: { i: i, j: j },
        sameAsFocused: sameAsFocused,
      },
    });
  };

  const handleDifficultyChange = event => setDifficulty(event.target.value);

  const handleSubmit = async () => {
    const data = {
      board: squares.map(line => line.map(
        x => x ? parseInt(x) : 0
      ))
    };
    const response = await axios.post(
      `${API_ENDPOINT}/validate`,
      encodeParams(data),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, },
    );

    setStatus(response.data.status);
  };

  const handleNewGrid = async () => {
    try {
      const result = await axios.get(
        `${API_ENDPOINT}/board?difficulty=${difficulty}`
      );
      const squares = result.data.board.map(line => line.map(x =>
        x ? x.toString() : ""
      ));

      setSquares(squares);
      dispatchFocus({ type: 'FOCUS_ON_EMPTY' });
    } catch {
      // TODO: handle the fetch error
      console.log('Fetch error: sudoku board initialization');
    }
  };

  return (
    <div className="game">
      <div className="game-board">
        <Board
          squares={squares}
          focusedSquare={focus.onFocus}
          sameAsFocusedSquares={focus.sameAsFocused}
          errorSquares={focus.errors}
          onSquareChange={handleSquareChange}
          onSquareFocus={handleSquareFocus}
        />
      </div>
      <div className="game-info">
        <div className="status">
          Status: {`${status}`}
        </div>
        <div className="submit">
          <button onClick={handleSubmit}>Submit</button>
        </div>
        <div className="difficulty">
          <select
            className="difficulty-selector"
            value={difficulty}
            onChange={handleDifficultyChange}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="random">Random</option>
          </select>
          <button onClick={handleNewGrid}>New grid</button>
        </div>
      </div>
    </div>
  );

}
