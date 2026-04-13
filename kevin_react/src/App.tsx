import './App.css'
import '@styles/animations.css'
import '@styles/projectCard.css'
//Remember to manually port leaflet css >;D
import 'leaflet/dist/leaflet.css'
import { ProjectCardData } from '@/markdowns/projectCard'
import { skillsCardData } from './markdowns/skills'
import ProjectCard from '@/components/projectCard'
import Map from '@/components/map'
import Resume from '@/components/resume'
import SkillsGrid from '@/components/skillsCard'

function App() {

  return (
    <>
      <div className="myName logo">
        <h1>Kevin Jiang</h1>
      </div>
      <div>
        <h1>Experiences</h1>
        <p>Explore the markers to see more about me!</p>
        <Map />
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
      <div>
        <h1>Skills</h1>
        <SkillsGrid data={skillsCardData.language} />
        <SkillsGrid data={skillsCardData.backend} />
        <SkillsGrid data={skillsCardData.frontend} />
        <SkillsGrid data={skillsCardData.dataml} />
        <SkillsGrid data={skillsCardData.databases} />
      </div>
      <div>
        <h1>Resumé</h1>
        <Resume />
      </div>
      <div>
        <h1>Contact</h1>
        
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
