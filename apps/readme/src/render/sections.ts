import type {
  ProfileData,
  LinkData,
  SkillCategoryData,
  ProjectData,
  CertificationData,
} from '@vh/profile';
import type { RepoStats } from '../github/github.schemas';
import { buildSkillsRadar, buildLanguagesChart } from '../mermaid';

const LANGUAGE_COLORS: Record<string, string> = {
  Spanish: 'CC0000',
  English: '1F6FEB',
};

interface LinkBadgeConfig {
  logo: string;
  color: string;
}

interface CredentialBadgeConfig {
  logo: string;
  color: string;
}

/**
 * Escapes text for use as a shields.io badge label segment.
 *
 * shields.io parses badge URLs as hyphen-delimited segments, so literal
 * spaces must become underscores and literal underscores/hyphens must be
 * doubled to avoid being misread as delimiters or escape sequences.
 *
 * @see https://shields.io/badges (label text escaping rules)
 */
function toShieldsLabel(text: string): string {
  return text.replace(/_/g, '__').replace(/-/g, '--').replace(/ /g, '_');
}

const LINK_BADGE_CONFIG: Record<string, LinkBadgeConfig> = {
  GitHub: { logo: 'github', color: '181717' },
  LinkedIn: { logo: 'linkedin', color: '0A66C2' },
  Resume: { logo: 'googlechrome', color: '4285F4' },
};

const CREDENTIAL_BADGE_CONFIG: Record<string, CredentialBadgeConfig> = {
  Toptal: { logo: 'toptal', color: '3863A0' },
};

export function renderHeader(profile: ProfileData): string {
  const encodedName = encodeURIComponent(profile.name);
  const locationSafe = toShieldsLabel(profile.location);

  const typingSvgBase = 'https://readme-typing-svg.demolab.com?font=Fira+Code';
  const typingSvgParams =
    `&weight=600&size=30&pause=1000&color=3178C6&center=true` +
    `&vCenter=true&width=650&height=70&lines=${encodedName}`;
  const typingLine = `[![Typing SVG](${typingSvgBase}${typingSvgParams})](https://git.io/typing-svg)`;

  const badgeRow = [
    { name: 'Node.js', color: '339933', logo: 'nodedotjs', logoColor: 'white' },
    {
      name: 'TypeScript',
      color: '3178C6',
      logo: 'typescript',
      logoColor: 'white',
    },
    { name: 'Angular', color: 'DD0031', logo: 'angular', logoColor: 'white' },
    { name: 'React', color: '61DAFB', logo: 'react', logoColor: 'black' },
    {
      name: 'AWS',
      color: '232F3E',
      logo: 'amazonwebservices',
      logoColor: 'white',
    },
    {
      name: 'Azure',
      color: '0078D4',
      logo: 'microsoftazure',
      logoColor: 'white',
    },
    { name: 'NestJS', color: 'E0234E', logo: 'nestjs', logoColor: 'white' },
    { name: '.NET', color: '512BD4', logo: 'dotnet', logoColor: 'white' },
  ]
    .map(
      ({ name, color, logo, logoColor }) =>
        `![${name}](https://img.shields.io/badge/${toShieldsLabel(name)}-${color}?logo=${logo}&style=for-the-badge&logoColor=${logoColor})`,
    )
    .join('&nbsp;\n');

  return `<div align="center">

${typingLine}

**${profile.headline}**

![Location](https://img.shields.io/badge/📍_${locationSafe}-555555?style=for-the-badge)

</div>

---

<div align="center">

${badgeRow}

</div>`;
}

export function renderSummary(profile: ProfileData): string {
  const sentences = profile.summary.split('. ');
  const condensed = sentences.slice(0, 3).join('. ').replace(/\.+$/, '') + '.';

  const languageBadges = profile.languages
    .map((lang) => {
      const color = LANGUAGE_COLORS[lang.language] ?? '555555';
      const language = toShieldsLabel(lang.language);
      const proficiency = toShieldsLabel(lang.proficiency);

      return `![${lang.language}](https://img.shields.io/badge/${language}-${proficiency}-${color}?style=for-the-badge)`;
    })
    .join('&nbsp;\n');

  return `## 👤 About\n\n> ${condensed}\n\n**Spoken Languages:**&nbsp;\n${languageBadges}`;
}

export function renderSkills(skills: readonly SkillCategoryData[]): string {
  if (skills.length === 0) return '';

  const radar = buildSkillsRadar(skills);

  return `## 🛠️ Skills\n\n${radar}`;
}

export function renderFeaturedProjects(
  projects: readonly ProjectData[],
  username: string,
): string {
  if (projects.length === 0) return '';

  const rows = projects
    .map((p) => {
      const starBadge = `![Stars](https://img.shields.io/github/stars/${username}/${p.name}?style=flat-square&label=⭐)`;

      return `| [**${p.name}**](${p.url}) | ${p.description} | ${starBadge} |`;
    })
    .join('\n');

  return `## 🚀 Featured Projects\n\n| Project | Description | Stars |\n|:---|:---|:---:|\n${rows}`;
}

export function renderTopLanguages(languages: Record<string, number>): string {
  const diagram = buildLanguagesChart(languages);

  if (!diagram) return '';

  return `## 💻 Top Languages\n\n${diagram}`;
}

export function renderGitHubStats(stats: RepoStats): string {
  const rows = [
    `| Public Repos | ${stats.publicRepos} |`,
    `| Total Stars | ⭐ ${stats.totalStars} |`,
    `| Total Forks | 🍴 ${stats.totalForks} |`,
  ].join('\n');

  return `## 📈 GitHub Stats\n\n| Metric | Value |\n|:---|:---:|\n${rows}`;
}

export function renderCredentials(
  certifications: readonly CertificationData[],
): string {
  const badges = certifications
    .filter((c) => c.badge && c.url)
    .map((c) => {
      const config = CREDENTIAL_BADGE_CONFIG[c.issuer];
      const logo = config?.logo ?? c.issuer.toLowerCase();
      const color = config?.color ?? '555555';
      const label = toShieldsLabel(`${c.issuer} — ${c.name}`).replace(
        /%/g,
        '%25',
      );
      const badgeUrl =
        `https://img.shields.io/badge/${label}-${color}` +
        `?style=for-the-badge&logo=${logo}&logoColor=white`;

      return `[![${c.issuer} — ${c.name}](${badgeUrl})](${c.url})`;
    });

  if (badges.length === 0) return '';

  return `## 🏆 Credentials\n\n<div align="center">\n\n${badges.join('&nbsp;\n')}\n\n</div>`;
}

export function renderCTA(
  links: readonly LinkData[],
  username: string,
): string {
  const badges = links
    .filter((l) => l.url.startsWith('http'))
    .map((l) => {
      const config = LINK_BADGE_CONFIG[l.label];
      const logo = config?.logo ?? (l.icon ?? l.label).toLowerCase();
      const color = config?.color ?? '555555';
      const label = toShieldsLabel(l.label);

      return `[![${l.label}](https://img.shields.io/badge/${label}-${color}?logo=${logo}&style=for-the-badge&logoColor=white)](${l.url})`;
    });

  if (username) {
    const { color, logo } = LINK_BADGE_CONFIG['Resume'];
    const resumeUrl = `https://${username}.github.io/${username}/`;
    const badgeUrl =
      `https://img.shields.io/badge/${toShieldsLabel('Resume')}-${color}` +
      `?logo=${logo}&style=for-the-badge&logoColor=white`;

    badges.push(`[![Resume](${badgeUrl})](${resumeUrl})`);
  }

  if (badges.length === 0) return '';

  return `## 🤝 Let's Connect\n\n<div align="center">\n\n${badges.join('&nbsp;\n')}\n\n</div>`;
}

export function renderDeveloperHub(): string {
  return (
    `## 🧑‍💻 For Developers\n\n` +
    `This README is auto-generated by a NestJS app on every push to \`main\`.\n` +
    `Looking for architecture details, local setup, or contribution guidelines?\n\n` +
    `**[Developer Hub → CONTRIBUTING.md](CONTRIBUTING.md)**`
  );
}

export function renderFooter(username: string): string {
  return `<div align="center">\n\n*Generated by [${username}](https://github.com/${username}/${username})*\n\n</div>`;
}
