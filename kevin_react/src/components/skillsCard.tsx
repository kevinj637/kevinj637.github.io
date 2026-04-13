import { skillsColorMap } from "@/markdowns/skills";
import { type SkillsCardProps } from "@/interfaces/skills";
import '@styles/skills.css'

export default function SkillsGrid({data}: {data: Array<SkillsCardProps>}) {
    return(
        <div className="skills-row">
            {data.map((value, index) => {
                const cloudSize = value.skill.length < 6 ? 'sk-cloud1' : value.skill.length < 10 ? 'sk-cloud2' : 'sk-cloud3';
                const skillsBackgroundColor = skillsColorMap[value.type].filterColor;
                const skillsTextColor = skillsColorMap[value.type].textColor;
                return (
                    <div className={`skills-base skills-col ${cloudSize} ${cloudSize}-hover cloud-drop` } key={index}
                    style={
                        {"--skills-background-color": `${skillsBackgroundColor}`} as React.CSSProperties}
                    >
                        <p
                        style={{color: `${skillsTextColor}`}}
                        >
                            <strong>{value.skill}</strong>
                        </p>
                    </div>
                )
            })}
        </div>
    )
}