import { autoFormat, type mapProps } from "@/interfaces/map"


/*
KEY NOTES:
MARKER OVERLAY IS BY DEFAULT DETERMINED BY LATITUDE. Lower Latitude objects will overlay higher latitude objects
Use indexOffset to solve this problem
*/

export const MapData: Record<string, mapProps>={
    Brandon1: {
        position: [49.906187194822785, -99.94337994924064],
        popupText: autoFormat({location: "Brandon, MB", time: "2022", teaser: "On Takeoff with (at that time) OCdt Mazotta 🛩️"}),
        imageLink: "/public/map/GliderTakeoff.jpg",
    },
    Brandon2: {
        position: [49.90717482402193, -99.92064440480625],
        popupText: autoFormat({location: "Brandon, MB", time: "2022", teaser: "Glider Training Scholarship, On Approach 🛬"}),
        imageLink: "/public/map/GliderApproach.jpg",
    },
    Brandon3: {
        position: [49.90682812628272, -99.94247742432906],
        popupText: autoFormat({location: "Brandon, MB", time: "2022", teaser: "Glider Training Scholarship, My First Solo 🛬"}),
        imageLink: "/public/map/GliderSoloTouchdown.jpg",
        indexOffset: 1,
    },
    Brandon4: {
        position: [49.90438817848602, -99.94828793693658],
        popupText: autoFormat({location: "Brandon, MB", time: "2022", teaser: "🪣 🌊 🥳 ???"}),
        imageLink: "/public/map/GliderDunking.jpg"
    },
    Brandon5: {
        position: [49.90668358671382, -99.9456237227627],
        popupText: autoFormat({location: "Brandon, MB", time: "2022", teaser: "Stuck after Solo Landing? 🛸"}),
        imageLink: "/public/map/GliderSoloLanding.jpg",
    },
    Brandon6: {
        position: [49.905009448485714, -99.94445789432227],
        popupText: autoFormat({location: "Brandon, MB", time: "2022", teaser: "Huey Ride? 🚁"}),
        imageLink: "/public/map/GliderHelicopter.jpg",
    },
    Regina1: {
        position: [50.417970691974766, -104.5848714867367],
        popupText: autoFormat({location: "Regina, SK", time: "2023", teaser: "Regis ??? 🪣 🌊 🥳"}),
        imageLink: "/public/map/PowerDunking.jpeg",
    },
    Regina2: {
        position: [50.4374963591256, -104.65357394234996],
        popupText: autoFormat({location: "Regina, SK", time: "2023", teaser: "Me with my instructor Raheem, solo complete 🛩️"}),
        imageLink: "/public/map/PowerSolo.jpeg"
    },
    Regina3: {
        position: [50.43852811100869, -104.66040356763608],
        popupText: autoFormat({location: "Regina, SK", time: "2023", teaser: "Chem trails? 🧪 ☁️ 👀 "}),
        imageLink: "/public/map/KREOS.JPG",
    },
    Regina4: {
        position: [50.440872952247524, -104.62240187215995],
        popupText: autoFormat({location: "Regina, SK", time: "2023", teaser: "Largest Provincial Legislative Building 🏰"}),
        imageLink: "/public/map/LegislatureSK.JPG",
    },
    Regina5: {
        position: [50.93794991899389, -102.81556645409356],
        popupText: autoFormat({location: "Melville, SK", time: "2023", teaser: "Small towns are awesome 🏠"}),
        imageLink: "/public/map/Melville.JPG",
    },
    Regina6: {
        position: [50.99130656217118, -104.34623781393665],
        popupText: autoFormat({time: "2023", teaser: "Checking off cross-country requirements 📝"}),
        imageLink: "/public/map/SecretLocationSK.JPG",
    },
    Regina7: {
        position: [49.67160128186212, -103.86572281645591],
        popupText: autoFormat({location: "Yorkton, SK", time: "2023", teaser: "Cross-Country Solo, 2/3 legs done 🛩️"}),
        imageLink: "/public/map/Weyburn.JPG"
    },
    Regina8: {
        position: [50.437529243533554, -104.65281453957033],
        popupText: autoFormat({location: "Regina, SK", time: "2023", teaser: "Power Pilot Scholarship Complete, Snowbirds Commander met 🧑‍✈️"}),
        imageLink: "/public/map/WingsCeremony.JPG",
    },
    Regina9: {
        position: [50.43765378876371, -104.65328820649334],
        popupText: autoFormat({location: "Regina, SK", time: "2023", teaser: "Power Pilot Scholarship Complete, Wings Obtained ✈️"}),
        imageLink: "/public/map/WingsGradCeremonyFormation.JPG",
    },
    Regina10: {
        position: [50.43774240774223, -104.65375921740068],
        popupText: autoFormat({location: "Regina, SK", time: "2023", teaser: "The sky is not the limit, for there are footsteps on the moon ✈️"}),
        imageLink: "/public/map/WingsGradCeremonyFunny.JPG",
        indexOffset: 1,
    },
    ColdLake1: {
        position: [54.417936262640595, -110.2745574322274],
        popupText: autoFormat({location: "Cold Lake, AB", time: "2024", teaser: "Teaching 🤓☝️✈️"}),
        imageLink: "/public/map/CTCTeaching.jpg",
    },
    ColdLake2: {
        position: [54.41077451202644, -110.27633781801252],
        popupText: autoFormat({location: "Cold Lake, AB", time: "2024", teaser: "Teaching 🤓☝️✈️"}),
        imageLink: "/public/map/CTCTeaching2.JPG",
        indexOffset: 1,
    },
    ColdLake3: {
        position: [54.41574774698818, -110.27732032147122],
        popupText: autoFormat({location: "Cold Lake, AB", time: "2024", teaser: "Lancaster (Cdt) Flight Sergeant, 🫡✈️"}),
        imageLink: "/public/map/MyStaffPosition.JPG",
    },
    ColdLake4: {
        position: [54.40439566181379, -110.27887235729956],
        popupText: autoFormat({location: "Cold Lake, AB", time: "2024", teaser: "Cold Lake Air Show 2024, a nice field trip ✈️"}),
        imageLink: "/public/map/CTCAirshow.jpeg",
        indexOffset: -1,
    },
    ColdLake5: {
        position: [54.43549174916436, -110.28528911696746],
        popupText: autoFormat({location: "Cold Lake, AB", time: "2024", teaser: "Evidence of my leadership & teaching skills: Top Flight!!! ✈️"}),
        imageLink: "/public/map/TopFlight.JPG",
    },
    VEX: {
        position: [51.08668033100261, -114.13762810596509],
        popupText: autoFormat({location: "Many 😉", time: "2022, 2023, 2024", teaser: "Skills Champions, Tournament Champions 🤖🏆"}),
        //SHARED WITH PROJECT
        imageLink: "/projects/VEX7.jpeg",
    },
    VEXWorlds: {
        position: [32.773733966369726, -96.80240113596484],
        popupText: autoFormat({location: "Dallas, TX", time: "2023", teaser: "Worlds Competitors 🤖"}),
        //SHARED WITH PROJECT
        imageLink: "/projects/VEX1.jpeg",
    },
    ASNA20251: {
        position: [43.09192568249971, -79.07257621431579],
        popupText: autoFormat({location: "Niagara Falls, ON", time: "2025", teaser: "Backrooms🚪"}),
        imageLink: "/public/map/ASNA1.jpg",
    },
    ASNA20252: {
        position: [43.090846157144185, -79.0729426198069],
        popupText: autoFormat({location: "Niagara Falls, ON", time: "2025", teaser: "At the 2025 ASNA Conference & Hackathon 🏆"}),
        imageLink: "/public/map/ASNA2.jpg",
    },
    UTRA1: {
        position: [43.66067361936095, -79.39666423068074],
        popupText: autoFormat({location: "Toronto, ON", time: "2025", teaser: "Shenanigans 🥘🍳🔥"}),
        imageLink: "/public/map/UTRA1.png",
    },
    UTRA2: {
        position: [43.66081251149976, -79.39662128348408],
        popupText: autoFormat({location: "Toronto, ON", time: "2025", teaser: "At UTRAHacks 2025 🏆"}),
        //SHARED WITH PROJECTS
        imageLink: "/projects/Me_with_team.jpg",
    },
    McHacks1: {
        position: [45.50445291010433, -73.57805485269579],
        popupText: autoFormat({location: "Montreal, QC", time: "2025", teaser: "Backrooms🚪"}),
        imageLink: "/public/map/McHacks1.jpg",
    },
    McHacks2: {
        position: [45.50476669295341, -73.57812096487447],
        popupText: autoFormat({location: "Montreal, QC", time: "2025", teaser: "At McHacks 2025 🏆"}),
        imageLink: "/public/map/McHacks2.jpg",
    },
    CRRG1: {
        position: [43.468146101120674, -80.54311997598049],
        popupText: autoFormat({location: "Waterloo, ON", time: "2025", teaser: "Research 🔬📝🧐"}),
        imageLink: "/public/map/UWCRRG.jpg",
    },
    RDH2: {
        position: [44.11578369681118, -77.55004424615282],
        popupText: autoFormat({location: "Trenton, ON", time: "2026", teaser: "Work Trip Mandatory Activity ✈️"}),
        imageLink: "/public/map/RDHWork3.jpg",
    },
    RDH3: {
        position: [44.11464844190945, -77.55006986723157],
        popupText: autoFormat({location: "Trenton, ON", time: "2026", teaser: "Work Trip Mandatory Activity ✈️"}),
        imageLink: "/public/map/RDHWork2.jpg",
    },
    RDH4: {
        position: [44.025197502990835, -77.90296337998485],
        popupText: autoFormat({location: "Somewhere, ON", time: "2026", teaser: "Work Trip Sightseeing 🕵🏻‍♂️🖼️🍎"}),
        imageLink: "/public/map/RDHApple.jpg",
        indexOffset: -100,
    },
    RDH1: {
        position: [44.11915514532517, -77.55286117269476],
        popupText: autoFormat({location: "Trenton, ON", time: "2026", teaser: "Products of one of teams I helped out 🚀"}),
        imageLink: "/public/map/RDHWork1.jpg",
        indexOffset: 1,
    },
    SOA1: {
        position: [47.6117930709619, -122.33294402548297],
        popupText: autoFormat({location: "Seattle, ON", time: "2026", teaser: "Attending, and being recognized at professional conference 💡🗣️"}),
        imageLink: "/public/map/SOA2025.jpg",
    },
    Boeing: {
        position: [47.92125153372701, -122.28925965397211],
        popupText: autoFormat({location: "", time: "", teaser: "Long-term interest: Transport & Aviation ✈️"}),
        imageLink: "/public/map/Boeing.jpg",
    },


}