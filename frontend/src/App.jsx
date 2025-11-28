// App.jsx
import React from "react";
import "tailwindcss";
import Home from "./pages/Home";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import BillList from "./pages/BillList";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list" element={<BillList />} />
      </Routes>
    </Router>
  );
};

export default App;
