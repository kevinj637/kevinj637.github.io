import { type ProjectCardProps } from "@/interfaces/projectCard"; 

export const ProjectCardData: Record<string, ProjectCardProps> = {
    Website: {
        title: "Personal Website",
        description: "A fun little project to showcase who I am to the rest of the world 😊",
        date: "2026",
        backgroundColour: "rgba(255, 128, 128, 0.6)",
        titleColour: "rgba(255, 167, 167, 0.6)"
    },
    SOACompetition2025: {
        title: "Factuarial: 1st Place @ SOA Research Challenge 2025",
        description: "Against 68 research teams across 17 countries, we presented a convincing strategy to win $7000 USD at this global challenge. Using machine learning to unravel and analyze simulated flood damage data, we contacted and coordinated with real flood policy researchers to deliver this winning case study.",
        attachDocument: "/public/projects/factuarial.pdf",
        linkTo: "https://www.theactuarymagazine.org/engaging-actuarial-students-curiosity/",
        date: "2025",
        backgroundColour: "rgba(233,233,233, 0.8)",
        titleColour: "rgba(180,255,200,0.8)",
    },
    UTRAHacks2025: {
        title: "LeBot James: 2nd Place Winner @ UTRAHacks 2025",
        description: "Built with sweat, tears, Arduino, and C++. At North America's largest robotics hackathon, we designed a robot that showed our hardware and programming skills through beating a series of maze and colour-recognition challenges.",
        linkTo: "https://devpost.com/software/lebot-james-qgf9kw",
        imageLinks: ["/public/projects/robotutra2025.jpg", "/public/projects/Me_with_team.jpg", "/public/projects/my_team_utra.jpg", "/public/projects/my_team_utra_2.jpg"],
        date: "2025",
        backgroundColour: "rgba(127 255 212 / 0.3 )",
        titleColour: "rgba(211 255 200 / 1)",
    },
    McHacks2025: {
        title: "Debug Debacle: 3rd Place Winner @ McHacks 2025",
        description: "Competing against 471 participants at Canada's Original Hackathon against 500+ competitors, we built Debug Debacle, a website where users compete to solve a bug. To make the challenge harder, there are no test cases and you only have 5 minutes to find the bug!",
        date: "2025",
        linkTo: "https://devpost.com/software/debug-debacle",
        imageLinks: ["/public/projects/mcHacks1.png", "/public/projects/mcHacks2.png", "/public/projects/mcHacks3.png", "/public/projects/mcHacks4.png", "/public/projects/mcHacks5.JPG"],
        backgroundColour:"rgba(253, 255, 119, 0.43)",
        titleColour: "lightYellow"
    },
    ASNA2025: {
        title: "Top 3 Finalist @ ASNA Hackathon",
        description: "Using a variety of machine learning models, we learned how to fine-tune models for accuracy, sensitivity, and most importantly, for interpretation. As one of the finalists, we had the privilege of presenting our work at the national 2025 ASNA Conference.",
        date: "2025",
        linkTo: "https://github.com/ericli3690/asna-one",
        imageLinks: ["/public/projects/ASNA1.png", "/public/projects/ASNA2.png", "/public/projects/ASNA3.png", "/public/projects/ASNA4.png"],
        backgroundColour: "rgba(255, 230, 200, 0.45)",
        titleColour: "rgba(255, 223, 223, 1)",   
    },
    FredBot: {
        title: "Fredbot: An early experiment with AI",
        description: "A project I made with some friends to investigate the abilities and usecases of LLMs. An absolutely hilarious and surprisingly interesting chatbot was the result!",
        date: "2024",
        imageLinks: ["/public/projects/FredBot1.png", "/public/projects/FredBot2.png", "/public/projects/FredBot3.png", "/public/projects/FredBot4.png"],
        linkTo: "https://git.uwaterloo.ca/a2/se101-project/-/tree/ae633b8c419b5042090589b12521ba804d662ea5/",
        backgroundColour: "rgba(167, 0, 226, 0.3)",
        titleColour: "rgba(128, 78, 255, 0.6)",
    },
    VEXRobotics: {
        title: "3388B: Can We Get Much Higher @ VEX Robotics",
        description: "Tournament champions, skills champions, and World Championship competitors. That was what my robotics team accomplished over the course of three years as we designed, built, and programmed a competitive VEX robot. Our team's performance inspired many others. Importantly, my efforts in organizing and mentoring the broader school team transformed it into a provincial heavyweight.",
        date: "2021-2024",
        imageLinks: ["/public/projects/VEX1.JPG", "/public/projects/VEX2.jpg", "/public/projects/VEX3.jpg", "/public/projects/VEX4.jpg", "/public/projects/VEX5.jpg", "/public/projects/VEX6.jpg", "/public/projects/VEX7.jpg", "/public/projects/VEX8.jpg", "/public/projects/VEX9.jpg"],
        backgroundColour: "rgba(100, 100, 100, 0.67)",
        titleColour: "rgba(255, 0, 0, 0.7)",
    },
    MyFirstGame: {
        title: "Flight Simulator: An Early Plane Game",
        description: "One of the first code projects that I shared, it's a simple 2-D flight simulator where you can fly a plane across a simple map! Built using Processing, it's a reminder of where I came from 😊.",
        date: "2021",
        videoLink: "/public/projects/SnapInsta.to_AQPLFXfHTeTFwJIUugb0_LUELAzXkWapvtjfRXoDHFAkNOCXnzLOyOjMuNVdgtVV8JT_nwq1dX29lVPsUNKm1PQHcVNlj_eeOWRY-yQ.mp4",
        linkTo: "https://www.instagram.com/p/CE78-P8AuT8/?utm_source=qr",
        backgroundColour: "rgba(255, 128, 0, 0.7)",
        titleColour: "rgba(255, 150, 0, 0.8)",
    }
}