import { type SkillsCardColors, type SkillsCardProps, type SkillsType } from "@/interfaces/skills";


//Order matters
export const skillsCardData: Record<SkillsType, Array<SkillsCardProps>> = {
    language: [
        {skill: "C/C++", type: "language"},
        {skill: "Python", type: "language"},
        {skill: "Javascript", type: "language"},
        {skill: "Typescript", type: "language"},
        {skill: "Java/Scala", type: "language"},
        {skill: "SQL", type: "language"},
        {skill: "R", type: "language"},
        {skill: "Bash", type: "language"},
    ],
    frontend: [
        {skill: "React.js", type: "frontend"},
        {skill: "Vue.js", type: "frontend"},
        {skill: "Bootstrap", type: "frontend"},
        {skill: "Shiny", type: "frontend"},
    ],
    backend: [
        {skill: "Node.js", type: "backend"},
        {skill: "Express.js", type: "backend"},
        {skill: "Flask", type: "backend"},
    ],
    cloud: [
        {skill: "Docker", type: "cloud"},
        {skill: "AWS", type: "cloud"},
        {skill: "Google Cloud Platform", type: "cloud"},
        {skill: "Nginx", type: "cloud"},
        {skill: "Apache", type: "cloud"},
    ],
    dataml: [
        {skill: "Pandas", type: "dataml"},
        {skill: "Numpy", type: "dataml"},
        {skill: "Pytorch", type: "dataml"},
        {skill: "Geopandas", type: "dataml"},
    ],
    databases: [
        {skill: "PostgreSQL", type: "databases"},
        {skill: "MongoDB", type: "databases"},
        {skill: "SQLite", type: "databases"},
        {skill: "Sequelize", type: "databases"},
    ]
}

export const skillsColorMap: Record<SkillsType, SkillsCardColors> = {
  language: {
    filterColor: "#11ff88aa",
    textColor: "#22cf22",
  },
  frontend: {
    filterColor: "#ffb347aa",
    textColor: "#ff8c00",
  },
  backend: {
    filterColor: "#ff6b6baa",
    textColor: "#c62828",     
  },
  cloud: {
    filterColor: "#ba68c8aa",
    textColor: "#8e24aa",
  },
  dataml: {
    filterColor: "#26a69aaa",
    textColor: "#00695c",
  },
  databases: {
    filterColor: "#ffd54faa",
    textColor: "#b28704",
  }
};