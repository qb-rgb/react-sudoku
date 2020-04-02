import React from 'react';

import Square from './Square';

export default function Board({
  squares,
  focusedSquare,
  sameAsFocusedSquares,
  errorSquares,
  onSquareChange,
  onSquareFocus
}) {

  const generatePositionClassName = (i, j) => {
    let iPos = '', jPos = '';

    if (i % 3 === 0) {
      iPos = 'top';
    } else if (i === 8) {
      iPos = 'bottom';
    }

    if (j % 3 === 0) {
      jPos = 'left';
    } else if (j === 8) {
      jPos = 'right';
    }

    if (iPos) {
      if (jPos) {
        return `${iPos}-${jPos}`;
      } else {
        return iPos;
      }
    } else if (jPos) {
      return jPos;
    } else {
      return null;
    }
  };

  const renderSquare = (i, j) => {
    const positionClassName = generatePositionClassName(i, j);

    return <Square
      key={i * 9 + j}
      value={squares[i][j]}
      isFocused={
        focusedSquare && focusedSquare.i === i && focusedSquare.j === j
      }
      isSameAsFocused={sameAsFocusedSquares.some(x => x.i === i && x.j === j)}
      isError={errorSquares.some(x => x.i === i && x.j === j)}
      positionClassName={positionClassName}
      onSquareChange={onSquareChange(i, j)}
      onSquareFocus={onSquareFocus(i, j)}
    />;
  }

  const buildBoard = () => {
    let squares = [];

    for (let i = 0; i < 9; i++) {
      let row = [];

      for (let j = 0; j < 9; j++) {
        row.push(renderSquare(i, j))
      }

      squares.push(<div key={i} className="board-row">{row}</div>);
    }

    return (<div>{squares}</div>);
  };

  return buildBoard();

}
