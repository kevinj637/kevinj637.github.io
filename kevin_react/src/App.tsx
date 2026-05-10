import { Routes, Route, HashRouter } from "react-router";

import '@/App.css'
import '@styles/animations.css'
import '@styles/projectCard.css'
import '@styles/welcome.css'
import '@styles/bg-clouds.css'
import Home from "@/pages/home";


function App() {

  return (
    <HashRouter>

      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}

export default App
