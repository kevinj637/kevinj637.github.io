import { useState } from 'react'
import './App.css'
import '@styles/animations.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="myName logo">
        <h1>Kevin Jiang</h1>
      </div>
      <div>
        <p>If you need help with somethingHere's some food for your thoughts...</p>
        <h2>Resume</h2>
      </div>
      <div className="card">
        <b>
        <p> Hello! My name is Kevin Jiang and this is my personal webpage!</p>
        <p>I am currently a software engineering student at the University of Waterloo, and therefore more likely than not open for work!</p>
        <p>Scroll down to see more about me!</p>
        {/* <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
      </b>
      </div>
      <p>
        This message was approved by Kevin Jiang 👍
      </p>
    </>
  )
}

export default App
