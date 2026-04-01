import { z } from "zod";

const linkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
  icon: z.string().optional(),
});

export type LinkData = z.infer<typeof linkSchema>;

const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  description: z.string(),
  technologies: z.array(z.string()),
});

export type ExperienceData = z.infer<typeof experienceSchema>;

const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
});

export type EducationData = z.infer<typeof educationSchema>;

const certificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  date: z.string().min(1),
  url: z.url().optional(),
});

export type CertificationData = z.infer<typeof certificationSchema>;

const skillCategorySchema = z.object({
  category: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
});

export type SkillCategoryData = z.infer<typeof skillCategorySchema>;

const languageSchema = z.object({
  language: z.string().min(1),
  proficiency: z.string().min(1),
});

export type LanguageData = z.infer<typeof languageSchema>;

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  location: z.string().min(1),
  avatarUrl: z.url().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  links: z.array(linkSchema),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  certifications: z.array(certificationSchema),
  skills: z.array(skillCategorySchema).min(1),
  languages: z.array(languageSchema),
});

export type ProfileData = z.infer<typeof profileSchema>;
