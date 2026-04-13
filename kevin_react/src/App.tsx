import './App.css'
import '@styles/animations.css'
import '@styles/projectCard.css'
import '@styles/welcome.css'
import '@styles/bg-clouds.css'
//Remember to manually port leaflet css >;D
import 'leaflet/dist/leaflet.css'
import { ProjectCardData } from '@/markdowns/projectCard'
import { skillsCardData } from './markdowns/skills'
import ProjectCard from '@/components/projectCard'
import Map from '@/components/map'
import Resume from '@/components/resume'
import SkillsGrid from '@/components/skillsCard'
import WelcomeCard from './components/welcomeCard'
import BackgroundClouds from './components/backgroundCloud'
function App() {

  return (
    <>
      <BackgroundClouds />
      <div className="myName logo">
        <h1>Kevin Jiang</h1>
      </div>
      <div>
        <WelcomeCard />
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
        <p>Feel free to reach out!</p>
        <p>Currently open to work and actively searching for new opportunities :)</p>
        <div className='contactWrapper'>
          <ul className='contactList'>
          <li><a href="mailto:kxjiang@uwaterloo.ca">→ kxjiang@uwaterloo.ca</a></li>
          <li><a href="tel:+18257123266">→ +1 (825)712-3266</a></li>
          <li><a href="https://www.github.com/kevinj637">→ github.com/kevinj637</a></li>
          <li><a href="https://www.linkedin.com/in/kevin-jiang637/">→ linkedin.com/in/kevin-jiang637</a></li>
          <li><a href="https://www.se-webring.xyz/">→ se-webring.xyz</a></li>
        </ul>
        </div>
      </div>
      
      <p>
        <br></br>
        <br></br>
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
