import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { ProfileStore } from '../stores/profile.store';

@Injectable({ providedIn: 'root' })
export class ResumeTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly profileStore = inject(ProfileStore);

  override updateTitle(_snapshot: RouterStateSnapshot): void {
    const { name, experience } = this.profileStore.profile;
    const currentRole = experience[0]?.role;
    const pageTitle = currentRole ? `${name} — ${currentRole}` : name;

    this.title.setTitle(pageTitle);
  }
}
