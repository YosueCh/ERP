import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  template: `
    <div class="page-container">
      <h1 style="color: #f1f5f9; font-size: 1.75rem; font-weight: 800;">Admin Usuarios</h1>
      <p style="color: #64748b;">En construcción...</p>
    </div>
  `,
  styles: [`.page-container { display: flex; flex-direction: column; gap: 1.5rem; }`]
})
export class AdminUsersComponent {}