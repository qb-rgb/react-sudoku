import React from 'react';

export default function Square({
  value,
  isFocused,
  isSameAsFocused,
  isError,
  positionClassName,
  onSquareChange,
  onSquareFocus
}) {

  const onChange = event => {
    const digit = event.target.value.charAt(0);
    const checkedValue = (digit && "0" <= digit && digit <= "9") ? digit : ""

    onSquareChange(checkedValue);
  }

  const onFocus = () => {
    onSquareFocus(value);
  }

  const getColor = () => {
    if (isFocused) {
      return "#5ad67f";
    } else if (isSameAsFocused) {
      return "#7dabf5";
    }else if (isError) {
      return "#ff4d4d";
    } else {
      return "black";
    }
  }

  return <textarea
    className={positionClassName ? `square ${positionClassName}` : "square"}
    value={value}
    onChange={onChange}
    onFocus={onFocus}
    style={{ color: getColor() }}
  />;

}
