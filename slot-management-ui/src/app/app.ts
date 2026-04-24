import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from './auth/auth.service';
import { LangService } from './i18n/lang.service';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
  template: `
    @if (showNav()) {
      <header>
        <div class="header-inner">
          <span class="logo">📅 {{ 'LOGIN.TITLE' | translate }}</span>
          <nav>
            @if (auth.isAdmin()) {
              <a routerLink="/generate" routerLinkActive="active">{{ 'NAV.GENERATE' | translate }}</a>
            }
            <a routerLink="/next-slots" routerLinkActive="active">{{ 'NAV.NEXT_AVAILABLE' | translate }}</a>
            <a routerLink="/all-slots"  routerLinkActive="active">{{ 'NAV.ALL_SLOTS' | translate }}</a>
            @if (auth.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="active">{{ 'NAV.ADMIN' | translate }}</a>
            }
          </nav>
          <div class="user-area">
            <button class="btn-lang" (click)="lang.toggle()">{{ 'NAV.LANG_SWITCH' | translate }}</button>
            @if (auth.currentUser()) {
              <a routerLink="/profile" routerLinkActive="active" class="profile-link">👤 {{ auth.currentUser()!.username }}</a>
              <button class="btn-logout" (click)="auth.logout()">{{ 'NAV.SIGN_OUT' | translate }}</button>
            }
          </div>
        </div>
      </header>
    }
    <main [class.auth-main]="!showNav()">
      <router-outlet />
    </main>
  `,
  styles: [`
    header {
      background: #2c3e50; color: white;
      padding: 0 2rem; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: sticky; top: 0; z-index: 100;
    }
    .header-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; height: 56px; gap: 1rem;
    }
    .logo { font-size: 1.1rem; font-weight: bold; white-space: nowrap; }
    nav { display: flex; gap: 0.2rem; flex: 1; flex-wrap: wrap; }
    nav a {
      color: rgba(255,255,255,0.75); text-decoration: none;
      padding: 0.4rem 0.9rem; border-radius: 6px; font-size: 0.9rem;
      transition: background 0.15s, color 0.15s;
      &:hover { background: rgba(255,255,255,0.1); color: white; }
      &.active { background: rgba(255,255,255,0.18); color: white; font-weight: 600; }
    }
    .user-area { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .profile-link {
      font-size: 0.9rem; color: rgba(255,255,255,0.85); text-decoration: none;
      padding: 0.3rem 0.6rem; border-radius: 5px;
      &:hover { background: rgba(255,255,255,0.1); color: white; }
      &.active { color: white; }
    }
    .btn-lang {
      background: rgba(255,255,255,0.12); color: white; border: 1px solid rgba(255,255,255,0.25);
      padding: 0.3rem 0.75rem; border-radius: 5px; cursor: pointer; font-size: 0.85rem;
      &:hover { background: rgba(255,255,255,0.22); }
    }
    .btn-logout {
      background: rgba(231,76,60,0.8); color: white; border: none;
      padding: 0.35rem 0.85rem; border-radius: 5px; cursor: pointer; font-size: 0.85rem;
      &:hover { background: #e74c3c; }
    }
    main { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
    main.auth-main { max-width: 100%; margin: 0; padding: 0; }
  `]
})
export class App {
  auth = inject(AuthService);
  lang = inject(LangService);

  private url = toSignal(
    inject(Router).events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: inject(Router).url }
  );

  showNav = computed(() => {
    const u = this.url();
    return !u.startsWith('/login') && !u.startsWith('/register');
  });
}
