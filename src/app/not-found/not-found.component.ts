import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  template: `
    <div class="not-found">
      <h2>404</h2>
      <p>{{ 'admin.pageNotFound' | translate }}</p>
      <a mat-raised-button color="primary" routerLink="/dashboard">{{ 'admin.backToDashboard' | translate }}</a>
    </div>
  `,
  styles: [
    `
      .not-found {
        text-align: center;
        margin-top: 60px;
      }
    `,
  ],
})
export class NotFoundComponent {}
