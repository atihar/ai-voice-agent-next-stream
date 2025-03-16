import * as React from "react";

const VoiceSVGComponent = (props) => (
  <svg
    fill="#fff"
    viewBox="0 0 24 24"
    id="voice"
    data-name="Flat Line"
    xmlns="http://www.w3.org/2000/svg"
    className="icon flat-line"
    {...props}
  >
    <path
      id="primary"
      d="M3,12H4a2,2,0,0,1,2,2v1a2,2,0,0,0,2,2H8a2,2,0,0,0,2-2V9a2,2,0,0,1,2-2h0a2,2,0,0,1,2,2v6a2,2,0,0,0,2,2h0a2,2,0,0,0,2-2V14a2,2,0,0,1,2-2h1"
      style={{
        fill: "none",
        stroke: "rgb(255, 255, 255)",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
      }}
    />
  </svg>
);
export default VoiceSVGComponent;
