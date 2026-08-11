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
    startDate: { year: 1887, month: 4 },
    endDate: { year: 1902, month: 1 },
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
    startDate: { year: 1888, month: 7 },
    endDate: { year: 1895, month: 3 },
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
    startDate: { year: 1884, month: 6 },
    endDate: { year: 1885, month: 3 },
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
    startDate: { year: 1882, month: 9 },
    endDate: { year: 1884, month: 5 },
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
    startDate: { year: 1875, month: 9 },
    graduationDate: { year: 1878, month: 12 },
    honors: 'Highest Honors — First Year',
  },
  {
    degree: 'Filosofia',
    degreeTranslation: 'Philosophy',
    institution: 'Charles-Ferdinand University',
    location: 'Prague, Czech Republic',
    startDate: { year: 1880, month: 1 },
    graduationDate: { year: 1880, month: 12 },
  },
];

const skills: SkillCategoryData[] = [
  {
    category: 'Electrical Engineering',
    skills: [
      { name: 'AC Power Systems', level: 5 },
      { name: 'Transformers', level: 5 },
      { name: 'Electric Motors', level: 4 },
      { name: 'Generators', level: 4 },
    ],
  },
  {
    category: 'Electromagnetic Theory',
    skills: [
      { name: 'Radio Waves', level: 4 },
      { name: 'Resonance', level: 4 },
      { name: 'High-Frequency', level: 3 },
      { name: 'Wireless Transmission', level: 5 },
    ],
  },
  {
    category: 'Mechanical Engineering',
    skills: [
      { name: 'Rotating Machinery', level: 3 },
      { name: 'Turbines', level: 3 },
      { name: 'Oscillators', level: 2 },
      { name: 'Fluid Dynamics', level: 2 },
    ],
  },
  {
    category: 'Applied Physics',
    skills: [
      { name: 'Electromagnetic Fields', level: 4 },
      { name: 'X-Ray Research', level: 2 },
      { name: 'Plasma Physics', level: 2 },
      { name: 'Cryogenics', level: 1 },
    ],
  },
  {
    category: 'Instrumentation',
    skills: [
      { name: 'Oscilloscopes', level: 3 },
      { name: 'Measurement Systems', level: 3 },
      { name: 'Vacuum Tubes', level: 4 },
      { name: 'Spark Gaps', level: 3 },
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
    type: 'portfolio',
    cta: false,
  },
  {
    label: 'Tesla Museum',
    url: 'https://nikolateslamuseum.org',
    icon: 'museum',
    target: 'blank',
    visibility: 'public',
    type: 'professional',
    cta: false,
  },
  {
    label: 'Publications',
    url: 'https://teslauniverse.com/nikola-tesla/articles',
    target: 'blank',
    visibility: 'public',
    type: 'portfolio',
    cta: false,
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
      date: { year: 1892, month: 6 },
      badge: false,
    },
    {
      name: 'Elliott Cresson Medal',
      issuer: 'Franklin Institute',
      date: { year: 1894, month: 1 },
      badge: false,
    },
  ],
  projects: [],
  skills,
  languages,
};
