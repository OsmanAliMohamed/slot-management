import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  username: string;
  email: string;
  role: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenUrl = `${environment.apiUrl}/connect/token`;
  private readonly registerUrl = `${environment.apiUrl}/api/account/register`;
  private readonly clientId = 'SlotManagement_Angular';
  private readonly scope = 'openid email profile roles SlotManagement';

  private _token = signal<string | null>(localStorage.getItem('access_token'));
  private _user = signal<UserInfo | null>(this.loadUser());

  readonly isLoggedIn = computed(() => !!this._token());
  readonly currentUser = computed(() => this._user());
  readonly token = computed(() => this._token());
  readonly isAdmin = computed(() => this._user()?.roles?.includes('admin') ?? false);

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: this.clientId,
      scope: this.scope
    });
    return this.http.post<TokenResponse>(this.tokenUrl, body.toString(), {
      headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
    }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.access_token);
        this._token.set(res.access_token);
        const user = this.decodeUser(res.access_token);
        localStorage.setItem('current_user', JSON.stringify(user));
        this._user.set(user);
      })
    );
  }

  register(username: string, emailAddress: string, password: string): Observable<unknown> {
    return this.http.post(this.registerUrl, { username, emailAddress, password, appName: 'SlotManagement' });
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private decodeUser(token: string): UserInfo {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = Array.isArray(payload.role) ? payload.role : (payload.role ? [payload.role] : []);
      return {
        username: payload.preferred_username ?? payload.unique_name ?? 'User',
        email: payload.email ?? '',
        role: roles[0] ?? 'user',
        roles
      };
    } catch {
      return { username: 'User', email: '', role: 'user', roles: [] };
    }
  }

  private loadUser(): UserInfo | null {
    const raw = localStorage.getItem('current_user');
    return raw ? JSON.parse(raw) : null;
  }
}
