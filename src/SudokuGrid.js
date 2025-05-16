import React from "react";

const SudokuGrid = ({ grid, handleChange }) => {
  return (
    <div style={{ display: "inline-block" }}>
      {grid.map((row, i) => (
        <div key={i} style={{ display: "flex" }}>
          {row.map((value, j) => (
            <input
              key={j}
              type="text"
              value={value}
              onChange={(e) => handleChange(i, j, e.target.value)}
              maxLength="1"
              style={{
                width: "40px",
                height: "40px",
                textAlign: "center",
                border: "1px solid black",
                fontSize: "20px",
                backgroundColor: "#f9f9f9",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SudokuGrid;
