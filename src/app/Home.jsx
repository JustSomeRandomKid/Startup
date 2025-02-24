import React from "react";
import { Link } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Auth from "./Auth"; // Import the Auth component
import RoomScreen from "./RoomScreen"; // Import the RoomScreen component

function Home() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>App</h1>
      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>
            <Link to="/Auth" style={{ textDecoration: "none", color: "blue" }}>Go to Auth</Link>
          </li>
          <li>
            <Link to="/RoomScreen" style={{ textDecoration: "none", color: "blue" }}>Go to rooms</Link>
          </li>
        </ul>
      </nav>

      {/* Define Routes here */}
      <Routes>
        <Route path="/Auth" element={<Auth />} />
        <Route path="/RoomScreen" element={<RoomScreen />} />
      </Routes>
    </div>
  );
}

export default Home;
