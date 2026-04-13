export type SkillsType = "frontend" | "language" | "backend" | "cloud" | "dataml" | "databases";
type RGB = `#${string}`
type RGBA = `#${string}`

export interface SkillsCardProps {
    skill: string;
    type: SkillsType;
}

export interface SkillsCardColors {
    filterColor: RGBA,
    textColor: RGB,
}