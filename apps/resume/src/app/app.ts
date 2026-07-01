import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FloatingActionsComponent } from '@vh/design-system';
import { ActionHubStore } from './stores/action-hub.store';

@Component({
  selector: 'vh-root',
  imports: [RouterOutlet, FloatingActionsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly actionHub = inject(ActionHubStore);
}
