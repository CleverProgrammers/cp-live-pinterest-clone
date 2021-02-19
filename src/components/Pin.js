import React from "react";
import "./Pin.css";

function Pin(props) {
  let { urls } = props;

  return (
    <div className="pin">
      <div className="pin__container">
        <img src={urls?.regular} alt="pin" />
      </div>
    </div>
  );
}

export default Pin;
