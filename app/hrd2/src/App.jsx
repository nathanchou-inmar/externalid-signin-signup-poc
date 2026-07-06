import { useState } from 'react';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Signup from "./Pages/Signup";
import Home from "./Pages/Home";
import Signin from "./Pages/Signin";
import Transition from './Pages/Transition';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Signin" element={<Signin />} />
        <Route path="/transition" element={<Transition />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App