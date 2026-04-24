import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SlotService } from '../slots/slot.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface UserDto {
  id: string;
  userName: string;
  name: string;
  surname: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

interface RoleItem {
  id: string;
  name: string;
}

interface PagedResult<T> { items: T[]; totalCount: number; }

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h1>Admin Portal</h1>
      <p class="subtitle">System overview and user management</p>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card stat-total">
        <div class="stat-value">{{ stats()?.totalSlots ?? '—' }}</div>
        <div class="stat-label">Total Slots</div>
      </div>
      <div class="stat-card stat-available">
        <div class="stat-value">{{ stats()?.availableSlots ?? '—' }}</div>
        <div class="stat-label">Available</div>
      </div>
      <div class="stat-card stat-booked">
        <div class="stat-value">{{ stats()?.bookedSlots ?? '—' }}</div>
        <div class="stat-label">Booked</div>
      </div>
      <div class="stat-card stat-users">
        <div class="stat-value">{{ totalUsers() }}</div>
        <div class="stat-label">Users</div>
      </div>
    </div>

    <!-- User management -->
    <div class="card" style="margin-top:2rem">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <h2 style="margin:0;font-size:1.1rem">User Management</h2>
        <input class="form-control" style="width:220px" placeholder="Search by username…"
               [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
      </div>

      @if (loadingUsers()) {
        <div class="loading">Loading users…</div>
      } @else if (users().length === 0) {
        <div class="empty">No users found.</div>
      } @else {
        <div class="table-wrap">
          <div class="result-count">{{ totalUsers() }} user(s)</div>
          <table class="slots-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr [class.editing-row]="editingUserId() === u.id">
                  <td><strong>{{ u.userName }}</strong></td>
                  <td>{{ (u.name || '') + (u.surname ? ' ' + u.surname : '') || '—' }}</td>
                  <td>{{ u.email }}</td>
                  <td>
                    @if (u.roles && u.roles.length > 0) {
                      @for (r of u.roles; track r) {
                        <span class="role-badge" [class.role-admin]="r === 'admin'">{{ r }}</span>
                      }
                    } @else {
                      <span style="color:#aaa;font-size:0.85rem">—</span>
                    }
                  </td>
                  <td>
                    @if (u.isActive) {
                      <span class="badge badge-success">Active</span>
                    } @else {
                      <span class="badge badge-danger">Inactive</span>
                    }
                  </td>
                  <td>
                    @if (editingUserId() === u.id) {
                      <button class="btn-cancel" (click)="cancelEdit()">Cancel</button>
                    } @else {
                      <button class="btn-edit-roles" (click)="startEditRoles(u)">Edit Roles</button>
                    }
                  </td>
                </tr>

                <!-- Inline role editor row -->
                @if (editingUserId() === u.id) {
                  <tr class="role-editor-row">
                    <td colspan="6">
                      <div class="role-editor">
                        <span class="role-editor-title">Assign roles to <strong>{{ u.userName }}</strong>:</span>

                        @if (loadingUserRoles()) {
                          <span style="color:#888;font-size:0.9rem">Loading roles…</span>
                        } @else {
                          <div class="role-checkboxes">
                            @for (role of availableRoles(); track role.id) {
                              <label class="role-check-label">
                                <input type="checkbox"
                                       [checked]="editingRoles().has(role.name)"
                                       (change)="toggleRole(role.name)" />
                                <span class="role-badge" [class.role-admin]="role.name === 'admin'">{{ role.name }}</span>
                              </label>
                            }
                          </div>

                          @if (rolesMsg()) {
                            <div class="role-msg" [class.role-msg-ok]="rolesOk()" [class.role-msg-err]="!rolesOk()">
                              {{ rolesMsg() }}
                            </div>
                          }

                          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
                            <button class="btn btn-primary btn-sm" (click)="saveRoles(u)" [disabled]="savingRoles()">
                              {{ savingRoles() ? 'Saving…' : 'Save Roles' }}
                            </button>
                            <button class="btn btn-sm" style="background:#ecf0f1;border:1px solid #ccc" (click)="cancelEdit()">
                              Cancel
                            </button>
                          </div>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button class="page-btn" (click)="goToPage(userPage() - 1)" [disabled]="userPage() <= 1">‹ Prev</button>
          @for (p of pageNumbers(); track p) {
            <button class="page-btn" [class.active]="p === userPage()" (click)="goToPage(p)">{{ p }}</button>
          }
          <button class="page-btn" (click)="goToPage(userPage() + 1)" [disabled]="userPage() >= totalUserPages()">Next ›</button>
          <span class="page-info">Page {{ userPage() }} of {{ totalUserPages() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem;
    }
    .stat-card {
      background: white; border-radius: 8px; padding: 1.5rem 1rem;
      text-align: center; border: 1px solid #ddd; border-top: 4px solid #4a90e2;
    }
    .stat-card.stat-available { border-top-color: #27ae60; }
    .stat-card.stat-booked    { border-top-color: #e74c3c; }
    .stat-card.stat-users     { border-top-color: #9b59b6; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #2c3e50; }
    .stat-label { font-size: 0.85rem; color: #7f8c8d; margin-top: 0.25rem; }

    .role-badge {
      display: inline-block; padding: 0.15rem 0.5rem; border-radius: 10px;
      font-size: 0.75rem; font-weight: 600; margin-right: 0.25rem;
      background: #e8f4fd; color: #2980b9;
    }
    .role-badge.role-admin { background: #fdecea; color: #c0392b; }

    .editing-row td { background: #f0f7ff !important; }

    .role-editor-row td { background: #f8fbff; padding: 0 !important; }
    .role-editor {
      padding: 1rem 1.25rem; border-top: 1px solid #dde8f5;
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;
    }
    .role-editor-title { font-size: 0.9rem; color: #555; }
    .role-checkboxes { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .role-check-label {
      display: flex; align-items: center; gap: 0.35rem; cursor: pointer;
      padding: 0.3rem 0.5rem; border-radius: 6px; border: 1px solid #e0e0e0;
      background: white; font-size: 0.85rem;
      &:hover { border-color: #4a90e2; background: #f0f7ff; }
    }
    .role-check-label input { cursor: pointer; }

    .role-msg { font-size: 0.85rem; padding: 0.3rem 0.6rem; border-radius: 4px; }
    .role-msg-ok  { background: #d4edda; color: #155724; }
    .role-msg-err { background: #f8d7da; color: #721c24; }

    .btn-edit-roles {
      background: #4a90e2; color: white; border: none; border-radius: 4px;
      padding: 0.25rem 0.7rem; font-size: 0.8rem; cursor: pointer;
      &:hover { background: #357abd; }
    }
    .btn-cancel {
      background: #ecf0f1; color: #555; border: 1px solid #ccc; border-radius: 4px;
      padding: 0.25rem 0.7rem; font-size: 0.8rem; cursor: pointer;
      &:hover { background: #dde1e4; }
    }
  `]
})
export class Admin implements OnInit {
  private http        = inject(HttpClient);
  private slotService = inject(SlotService);
  private apiBase     = `${environment.apiUrl}/api/identity/users`;
  private rolesApi    = `${environment.apiUrl}/api/identity/roles`;

  stats        = signal<{ totalSlots: number; availableSlots: number; bookedSlots: number } | null>(null);
  users        = signal<UserDto[]>([]);
  totalUsers   = signal(0);
  loadingUsers = signal(true);
  userPage     = signal(1);
  pageSize     = 10;
  searchText   = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // Role editor state
  availableRoles    = signal<RoleItem[]>([]);
  editingUserId     = signal<string | null>(null);
  editingRoles      = signal<Set<string>>(new Set());
  loadingUserRoles  = signal(false);
  savingRoles       = signal(false);
  rolesMsg          = signal('');
  rolesOk           = signal(false);

  totalUserPages = computed(() => Math.ceil(this.totalUsers() / this.pageSize) || 1);
  pageNumbers    = computed(() => {
    const total = this.totalUserPages();
    const cur   = this.userPage();
    const start = Math.max(1, cur - 2);
    const end   = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
    this.loadAvailableRoles();
  }

  loadStats() {
    this.slotService.getSlotStats().subscribe({ next: s => this.stats.set(s), error: () => {} });
  }

  loadAvailableRoles() {
    const params = new HttpParams().set('MaxResultCount', 100);
    this.http.get<PagedResult<RoleItem>>(this.rolesApi, { params }).subscribe({
      next: res => this.availableRoles.set(res.items),
      error: () => {}
    });
  }

  loadUsers() {
    this.loadingUsers.set(true);
    const params = new HttpParams()
      .set('SkipCount', (this.userPage() - 1) * this.pageSize)
      .set('MaxResultCount', this.pageSize)
      .set('Filter', this.searchText);

    this.http.get<PagedResult<UserDto>>(this.apiBase, { params }).subscribe({
      next: res => {
        // Initialize with empty roles, then fetch each user's roles
        const users = res.items.map(u => ({ ...u, roles: [] as string[] }));
        this.users.set(users);
        this.totalUsers.set(res.totalCount);
        this.loadingUsers.set(false);
        this.fetchAllUserRoles(users);
      },
      error: () => this.loadingUsers.set(false)
    });
  }

  private fetchAllUserRoles(users: UserDto[]) {
    const requests = users.map(u =>
      this.http.get<PagedResult<RoleItem>>(`${this.apiBase}/${u.id}/roles`).pipe(
        map(r => ({ id: u.id, roles: r.items.map(i => i.name) })),
        catchError(() => of({ id: u.id, roles: [] as string[] }))
      )
    );
    forkJoin(requests).subscribe(results => {
      this.users.update(current =>
        current.map(u => {
          const found = results.find(r => r.id === u.id);
          return found ? { ...u, roles: found.roles } : u;
        })
      );
    });
  }

  startEditRoles(user: UserDto) {
    this.editingUserId.set(user.id);
    this.editingRoles.set(new Set(user.roles));
    this.rolesMsg.set('');
    this.loadingUserRoles.set(false);
  }

  cancelEdit() {
    this.editingUserId.set(null);
    this.editingRoles.set(new Set());
    this.rolesMsg.set('');
  }

  toggleRole(roleName: string) {
    const current = new Set(this.editingRoles());
    if (current.has(roleName)) current.delete(roleName);
    else current.add(roleName);
    this.editingRoles.set(current);
  }

  saveRoles(user: UserDto) {
    const roleNames = Array.from(this.editingRoles());
    this.savingRoles.set(true);
    this.rolesMsg.set('');

    this.http.put(`${this.apiBase}/${user.id}/roles`, { roleNames }).subscribe({
      next: () => {
        // Update the user's roles in the local list
        this.users.update(current =>
          current.map(u => u.id === user.id ? { ...u, roles: roleNames } : u)
        );
        this.rolesOk.set(true);
        this.rolesMsg.set('Roles updated successfully.');
        this.savingRoles.set(false);
        setTimeout(() => { this.editingUserId.set(null); this.rolesMsg.set(''); }, 1200);
      },
      error: err => {
        this.rolesOk.set(false);
        this.rolesMsg.set(err?.error?.error?.message ?? `Failed to update roles (${err.status})`);
        this.savingRoles.set(false);
      }
    });
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalUserPages()) return;
    this.userPage.set(p);
    this.cancelEdit();
    this.loadUsers();
  }

  onSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.userPage.set(1); this.cancelEdit(); this.loadUsers(); }, 350);
  }
}
