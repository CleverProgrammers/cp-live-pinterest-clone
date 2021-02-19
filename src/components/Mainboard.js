import React from "react";
import Pin from "./Pin";
import "./Mainboard.css";

function Mainboard(props) {
  let { pins } = props;

  return (
    <div className="mainboard">
      <div className="mainboard__container">
        {pins.map((pin) => {
          let { urls } = pin;
          return <Pin urls={urls} />;
        })}
      </div>
    </div>
  );
}

export default Mainboard;
