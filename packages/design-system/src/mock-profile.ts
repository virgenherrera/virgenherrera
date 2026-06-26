import type {
  ProfileData,
  EducationData,
  ExperienceData,
  LanguageData,
  LinkData,
  SkillCategoryData,
} from '@vh/profile';
import type { DescriptionBlock } from '@vh/profile';

const experience: ExperienceData[] = [
  {
    company: 'Tesla Electric Company',
    role: 'Founder & Chief Engineer',
    startDate: '1887-04',
    endDate: '1902-01',
    description: [
      {
        type: 'paragraph',
        lines: [
          'Founded the Tesla Electric Company to develop and commercialize revolutionary AC motor designs and polyphase power systems.',
        ],
      },
      {
        type: 'bullets',
        lines: [
          'Designed the polyphase AC motor that became the foundation of modern power distribution',
          'Developed the Tesla coil, enabling high-voltage, high-frequency experiments',
          'Filed over 40 patents for AC machinery, transformers, and distribution systems',
        ],
      },
      {
        type: 'paragraph',
        lines: [
          'Demonstrated AC power superiority over DC in public exhibitions, accelerating industry adoption worldwide.',
        ],
      },
    ] as DescriptionBlock[],
    technologies: [
      'AC Motors',
      'Tesla Coil',
      'Polyphase Systems',
      'High-Frequency Apparatus',
      'Wireless Energy',
    ],
  },
  {
    company: 'Westinghouse Electric & Manufacturing',
    role: 'Consulting Engineer',
    startDate: '1888-07',
    endDate: '1895-03',
    description: [
      {
        type: 'paragraph',
        lines: [
          'Licensed AC motor patents to Westinghouse and served as consulting engineer' +
            ' during the critical scale-up of alternating current power systems.',
        ],
      },
      {
        type: 'bullets',
        lines: [
          'Collaborated on the design of the Niagara Falls hydroelectric power plant',
          'Adapted polyphase motor designs for industrial manufacturing scale',
          "Contributed to winning the War of Currents against Edison's DC system",
        ],
      },
    ] as DescriptionBlock[],
    technologies: [
      'Alternating Current',
      'Transformers',
      'Polyphase Systems',
      'Hydroelectric Power',
      'Industrial Motors',
    ],
  },
  {
    company: 'Edison Machine Works',
    role: 'Electrical Engineer',
    startDate: '1884-06',
    endDate: '1885-03',
    description: [
      {
        type: 'paragraph',
        lines: [
          'Hired by Thomas Edison to redesign and improve direct current generators at the Edison Machine Works in New York.',
        ],
      },
      {
        type: 'bullets',
        lines: [
          'Redesigned DC dynamos for improved efficiency and reliability',
          'Developed solutions for arc lighting installations',
        ],
      },
      {
        type: 'paragraph',
        lines: [
          'Departed after disagreements over the potential of alternating current, which Edison famously dismissed.',
        ],
      },
    ] as DescriptionBlock[],
    technologies: ['DC Generators', 'Arc Lighting', 'Dynamos'],
  },
  {
    company: 'Continental Edison Company',
    role: 'Junior Electrical Engineer',
    startDate: '1882-09',
    endDate: '1884-05',
    description: [
      {
        type: 'paragraph',
        lines: [
          'Worked on electrical installations and improvements to DC generation equipment at the Paris branch of the Edison Company.',
        ],
      },
    ] as DescriptionBlock[],
    technologies: ['DC Power', 'Electrical Installations', 'Lighting Systems'],
  },
];

const education: EducationData[] = [
  {
    degree: 'Ingenieria Electrica',
    degreeTranslation: 'Electrical Engineering',
    institution: 'Graz University of Technology',
    location: 'Graz, Austria',
    startDate: '1875-09',
    graduationDate: '1878-12',
    honors: 'Highest Honors — First Year',
  },
  {
    degree: 'Filosofia',
    degreeTranslation: 'Philosophy',
    institution: 'Charles-Ferdinand University',
    location: 'Prague, Czech Republic',
    startDate: '1880-01',
    graduationDate: '1880-12',
  },
];

const skills: SkillCategoryData[] = [
  {
    category: 'Electrical Engineering',
    skills: [
      'AC Power Systems',
      'Transformers',
      'Electric Motors',
      'Generators',
    ],
  },
  {
    category: 'Electromagnetic Theory',
    skills: [
      'Radio Waves',
      'Resonance',
      'High-Frequency',
      'Wireless Transmission',
    ],
  },
  {
    category: 'Mechanical Engineering',
    skills: ['Rotating Machinery', 'Turbines', 'Oscillators', 'Fluid Dynamics'],
  },
  {
    category: 'Applied Physics',
    skills: [
      'Electromagnetic Fields',
      'X-Ray Research',
      'Plasma Physics',
      'Cryogenics',
    ],
  },
  {
    category: 'Instrumentation',
    skills: [
      'Oscilloscopes',
      'Measurement Systems',
      'Vacuum Tubes',
      'Spark Gaps',
    ],
  },
];

const languages: LanguageData[] = [
  { language: 'Serbian', proficiency: 'Native' },
  { language: 'English', proficiency: 'C2' },
  { language: 'German', proficiency: 'C1' },
  { language: 'French', proficiency: 'B2' },
  { language: 'Italian', proficiency: 'B1' },
];

const links: LinkData[] = [
  {
    label: 'Patents Archive',
    url: 'https://teslauniverse.com/nikola-tesla/patents',
    icon: 'patent',
    target: 'blank',
    visibility: 'public',
  },
  {
    label: 'Tesla Museum',
    url: 'https://nikolateslamuseum.org',
    icon: 'museum',
    target: 'blank',
    visibility: 'public',
  },
  {
    label: 'Publications',
    url: 'https://teslauniverse.com/nikola-tesla/articles',
    target: 'blank',
    visibility: 'public',
  },
];

export const mockProfile: ProfileData = {
  name: 'Nikola Tesla',
  headline: 'Electrical Engineer | Inventor | Futurist',
  summary: [
    'Pioneering electrical engineer and inventor whose work on',
    'alternating current power systems revolutionized modern',
    'electricity distribution. Holder of over 300 patents across',
    '26 countries, with groundbreaking contributions to',
    'electromagnetic theory, radio technology, and rotating',
    'machinery. A visionary who imagined wireless communication',
    'and energy transmission decades before their realization.',
  ].join(' '),
  location: 'New York City, NY',
  email: 'nikola@teslaelectric.com',
  phone: '+1 212 555 1893',
  links,
  experience,
  education,
  certifications: [
    {
      name: 'Order of St. Sava',
      issuer: 'Kingdom of Serbia',
      date: '1892-06',
    },
    {
      name: 'Elliott Cresson Medal',
      issuer: 'Franklin Institute',
      date: '1894-01',
    },
  ],
  projects: [],
  skills,
  languages,
};
