import { type ProjectCardProps } from "@/interfaces/projectCard";

export const ProjectCardData: Record<string, ProjectCardProps> = {
    UTRAHacks2025: {
        title: "LeBot James: 2nd Place Winner @ UTRAHacks 2025",
        description: "Built with sweat, tears, Arduino, and C++. At North America's largest robotics hackathon, we designed a robot that showed our hardware and programming skills through beating a series of maze and colour-recognition challenges.",
        linkTo: "https://devpost.com/software/lebot-james-qgf9kw",
        imageLinks: ["/projects/robotutra2025.jpg", "/projects/Me_with_team.jpg", "/projects/my_team_utra.jpg", "/projects/my_team_utra_2.jpg"],
        date: "2025",
        backgroundColour: "rgba(127 255 212 / 0.3 )",
        titleColour: "rgba(245 245 245 / 0.7)",
    },
    McHacks2025: {
        title: "Debug Debacle: 3rd Place Winner @ McHacks 2025",
        description: "Competing against 471 participants at Canada's Original Hackathon against 500+ competitors, we built Debug Debacle, a website where users compete to solve a bug. To make the challenge harder, there are no test cases and you only have 5 minutes to find the bug!",
        date: "2025",
        linkTo: "https://devpost.com/software/debug-debacle",
        imageLinks: ["/projects/mcHacks1.png", "/projects/mcHacks2.png", "/projects/mcHacks3.png", "/projects/mcHacks4.png", "/projects/mcHacks5.png"],
        backgroundColour:"rgba(253, 255, 119, 0.43)",
        titleColour: "lightYellow"
    },
    ASNA2025: {
        title: "Top 3 Finalist @ ASNA Hackathon",
        description: "Using a variety of machine learning models, we learned how to fine-tune models for accuracy, sensitivity, and most importantly, for interpretation. As one of the finalists, we had the privilege of presenting our work at the national 2025 ASNA Conference.",
        date: "2025",
        linkTo: "https://github.com/ericli3690/asna-one",
        imageLinks: ["/projects/ASNA1.png", "/projects/ASNA2.png", "/projects/ASNA3.png", "/projects/ASNA4.png"],
        backgroundColour: "rgba(255, 230, 200, 0.45)",
        titleColour: "rgba(255, 0, 0, 0.6)",   
    },
    FredBot: {
        title: "Fredbot: An early experiment with AI",
        description: "A project I made with some friends to investigate the abilities and usecases of LLMs. An absolutely hilarious and surprisingly interesting chatbot was the result!",
        date: "2024",
        imageLinks: ["/projects/FredBot1.png", "/projects/FredBot2.png", "/projects/FredBot3.png", "/projects/FredBot4.png"],
        linkTo: "https://git.uwaterloo.ca/a2/se101-project/-/tree/ae633b8c419b5042090589b12521ba804d662ea5/",
        backgroundColour: "rgba(167, 0, 226, 0.3)",
        titleColour: "rgba(128, 78, 255, 0.6)",
    },
    MyFirstGame: {
        title: "Flight Simulator: An Early Plane Game",
        description: "This was one of the first games that I published and shared, it's a simple 2-D flight simulator where you can fly a plane across a simple map! Built in Processing, it's a cool reminder of where I came from 😊.",
        date: "2021",
        videoLink: "/projects/SnapInsta.to_AQPLFXfHTeTFwJIUugb0_LUELAzXkWapvtjfRXoDHFAkNOCXnzLOyOjMuNVdgtVV8JT_nwq1dX29lVPsUNKm1PQHcVNlj_eeOWRY-yQ.mp4",
        linkTo: "https://www.instagram.com/p/CE78-P8AuT8/?utm_source=qr",
        backgroundColour: "rgba(255, 128, 0, 0.7)",
        titleColour: "rgba(255, 150, 0, 0.8)",
    }

}