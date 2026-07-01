import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FloatingActionsComponent } from '@vh/design-system';

@Component({
  selector: 'vh-root',
  imports: [RouterOutlet, FloatingActionsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
