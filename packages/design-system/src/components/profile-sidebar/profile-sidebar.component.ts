import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';
import type {
  EducationData,
  LanguageData,
  LinkData,
  SkillCategoryData,
} from '@vh/profile';
import { AvatarComponent } from '../avatar/avatar.component';
import { ContactLinkComponent } from '../contact-link/contact-link.component';
import { EducationItemComponent } from '../education-item/education-item.component';
import { LanguageBadgeComponent } from '../language-badge/language-badge.component';
import { SkillGroupComponent } from '../skill-group/skill-group.component';

@Component({
  selector: 'vh-profile-sidebar',
  standalone: true,
  imports: [
    AvatarComponent,
    SkillGroupComponent,
    EducationItemComponent,
    LanguageBadgeComponent,
    ContactLinkComponent,
  ],
  templateUrl: './profile-sidebar.component.html',
  styleUrl: './profile-sidebar.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ProfileSidebarComponent {
  readonly name = input.required<string>();
  readonly headline = input.required<string>();
  readonly avatarSrc = input('');
  readonly avatarAlt = input('');
  readonly location = input('');
  readonly summary = input('');
  readonly variant = input<'public' | 'private'>('private');
  readonly skills = input<readonly SkillCategoryData[]>([]);
  readonly education = input<readonly EducationData[]>([]);
  readonly languages = input<readonly LanguageData[]>([]);
  readonly links = input<readonly LinkData[]>([]);
  readonly email = input('');
  readonly phone = input('');

  protected readonly isPrivate = computed(() => this.variant() === 'private');

  protected readonly visibleContactLinks = computed<readonly LinkData[]>(() => {
    const publicLinks = this.links().filter(
      (link) => link.visibility === 'public',
    );

    if (!this.isPrivate()) return publicLinks;

    const privateLinks: LinkData[] = [];
    const emailValue = this.email();
    const phoneValue = this.phone();

    if (emailValue) {
      privateLinks.push({
        label: 'Email',
        url: `mailto:${emailValue}`,
        icon: 'mail',
        target: 'blank',
        visibility: 'private',
        type: 'social',
        cta: false,
      });
    }
    if (phoneValue) {
      privateLinks.push({
        label: 'Phone',
        url: `tel:${phoneValue}`,
        icon: 'phone',
        target: 'self',
        visibility: 'private',
        type: 'social',
        cta: false,
      });
    }

    return [...privateLinks, ...publicLinks];
  });

  protected readonly summaryExpanded = signal(false);

  protected readonly showSummaryToggle = computed(
    () => this.isPrivate() && this.summary().length > 300,
  );

  protected readonly displaySummary = computed(() => {
    const fullText = this.summary();
    if (!fullText || this.variant() === 'private') return fullText;
    const sentences = fullText.match(/[^.!?]+[.!?]+/g) ?? [fullText];

    return sentences.slice(0, 2).join('').trim();
  });
}
