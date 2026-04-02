export interface LinkData {
  label: string;
  url: string;
  icon?: string;
}

export interface ExperienceData {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string[];
  technologies: string[];
}

export interface EducationData {
  degree: string;
  degreeTranslation: string;
  institution: string;
  location: string;
  startDate: string;
  graduationDate: string;
  honors?: string;
}

export interface CertificationData {
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface SkillCategoryData {
  category: string;
  skills: string[];
}

export interface LanguageData {
  language: string;
  proficiency: string;
}

export interface ProfileData {
  name: string;
  headline: string;
  summary: string;
  location: string;
  avatarUrl?: string;
  email?: string;
  links: LinkData[];
  experience: ExperienceData[];
  education: EducationData[];
  certifications: CertificationData[];
  skills: SkillCategoryData[];
  languages: LanguageData[];
}
