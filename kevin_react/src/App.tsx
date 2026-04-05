import { useState } from 'react'
import './App.css'
import '@styles/animations.css'
import { ProjectCardData } from '@/markdowns/projectCard'
import ProjectCard from '@/components/projectCard'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="myName logo">
        <h1>Kevin Jiang</h1>
      </div>
      <div>
        <h1>Experiences</h1>
        <p>Click the map to see more about me!</p>
      </div>
      <div>
        <h1>Projects</h1>
        <ProjectCard {...ProjectCardData.Website}/>
        <ProjectCard {...ProjectCardData.SOACompetition2025} />
        <ProjectCard {...ProjectCardData.UTRAHacks2025}/>
        <ProjectCard {...ProjectCardData.McHacks2025}/>
        <ProjectCard {...ProjectCardData.ASNA2025}/>
        <ProjectCard {...ProjectCardData.FredBot}/>
        <ProjectCard {...ProjectCardData.VEXRobotics}/>
        <ProjectCard {...ProjectCardData.MyFirstGame}/>
      </div>
      <div className="card">
        
        <p> Hello! My name is <b>Kevin Jiang</b> and I am currently a <b>software engineering student</b> at the University of Waterloo!</p>
        <p> Scroll down to see more about me!</p>
      </div>
      <p>
        This message was approved by Kevin Jiang 👍
      </p>





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
    </>
  )
}

export default App
