import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

interface MyProfile {
  userName: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber: string | null;
  concurrencyStamp?: string;
}

function passwordMatch(c: AbstractControl): ValidationErrors | null {
  const pw  = c.get('newPassword')?.value;
  const cpw = c.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { mismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <h1>{{ 'PROFILE.TITLE' | translate }}</h1>
      <p class="subtitle">{{ 'PROFILE.SUBTITLE' | translate }}</p>
    </div>

    <div class="card">
      <h2 style="margin:0 0 1.25rem;font-size:1.1rem">{{ 'PROFILE.ACCOUNT_INFO' | translate }}</h2>

      @if (loadError()) {
        <div class="alert alert-danger">{{ loadError() }}</div>
      }

      @if (loading()) {
        <div class="loading">{{ 'PROFILE.LOADING' | translate }}</div>
      } @else {
        @if (profileMsg()) {
          <div class="alert" [class.alert-success]="profileOk()" [class.alert-danger]="!profileOk()">
            {{ profileMsg() }}
          </div>
        }

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'PROFILE.FIRST_NAME' | translate }}</label>
              <input class="form-control" formControlName="name" />
            </div>
            <div class="form-group">
              <label>{{ 'PROFILE.LAST_NAME' | translate }}</label>
              <input class="form-control" formControlName="surname" />
            </div>
          </div>
          <div class="form-group">
            <label>{{ 'PROFILE.USERNAME' | translate }}</label>
            <input class="form-control" formControlName="userName" />
            @if (profileForm.get('userName')?.invalid && profileForm.get('userName')?.touched) {
              <span class="error">{{ 'PROFILE.USERNAME_REQUIRED' | translate }}</span>
            }
          </div>
          <div class="form-group">
            <label>{{ 'PROFILE.EMAIL' | translate }}</label>
            <input class="form-control" type="email" formControlName="email" />
            @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
              <span class="error">{{ 'PROFILE.EMAIL_REQUIRED' | translate }}</span>
            }
          </div>
          <div class="form-group">
            <label>{{ 'PROFILE.PHONE' | translate }}</label>
            <input class="form-control" formControlName="phoneNumber" />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="profileForm.invalid || saving()">
              {{ saving() ? ('PROFILE.SAVING' | translate) : ('PROFILE.SAVE' | translate) }}
            </button>
          </div>
        </form>
      }
    </div>

    <div class="card">
      <h2 style="margin:0 0 1.25rem;font-size:1.1rem">{{ 'PROFILE.CHANGE_PASSWORD' | translate }}</h2>

      @if (pwMsg()) {
        <div class="alert" [class.alert-success]="pwOk()" [class.alert-danger]="!pwOk()">
          {{ pwMsg() }}
        </div>
      }

      <form [formGroup]="pwForm" (ngSubmit)="changePassword()">
        <div class="form-group">
          <label>{{ 'PROFILE.CURRENT_PASSWORD' | translate }}</label>
          <input class="form-control" type="password" formControlName="currentPassword" />
        </div>
        <div class="form-group">
          <label>{{ 'PROFILE.NEW_PASSWORD' | translate }}</label>
          <input class="form-control" type="password" formControlName="newPassword" />
          @if (pwForm.get('newPassword')?.hasError('minlength') && pwForm.get('newPassword')?.touched) {
            <span class="error">{{ 'PROFILE.PASSWORD_MIN' | translate }}</span>
          }
        </div>
        <div class="form-group">
          <label>{{ 'PROFILE.CONFIRM_PASSWORD' | translate }}</label>
          <input class="form-control" type="password" formControlName="confirmPassword" />
          @if (pwForm.hasError('mismatch') && pwForm.get('confirmPassword')?.touched) {
            <span class="error">{{ 'PROFILE.PASSWORDS_MISMATCH' | translate }}</span>
          }
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit" [disabled]="pwForm.invalid || changingPw()">
            {{ changingPw() ? ('PROFILE.UPDATING' | translate) : ('PROFILE.UPDATE' | translate) }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class Profile implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);
  // Correct ABP endpoint (identity/my-profile returns 404; account/my-profile is the real one)
  private api  = `${environment.apiUrl}/api/account/my-profile`;

  loading    = signal(true);
  loadError  = signal('');
  saving     = signal(false);
  profileMsg = signal('');
  profileOk  = signal(false);
  changingPw = signal(false);
  pwMsg      = signal('');
  pwOk       = signal(false);

  profileForm = this.fb.group({
    userName:    ['', Validators.required],
    name:        [''],
    surname:     [''],
    email:       ['', [Validators.required, Validators.email]],
    phoneNumber: ['']
  });

  pwForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatch });

  ngOnInit() {
    this.http.get<MyProfile>(this.api).subscribe({
      next: p => {
        this.profileForm.patchValue({
          userName:    p.userName    ?? '',
          name:        p.name        ?? '',
          surname:     p.surname     ?? '',
          email:       p.email       ?? '',
          phoneNumber: p.phoneNumber ?? ''
        });
        this.loading.set(false);
      },
      error: err => {
        const msg = err?.error?.error?.message ?? `Failed to load profile (${err.status ?? 'network error'})`;
        this.loadError.set(msg);
        this.loading.set(false);
      }
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    this.profileMsg.set('');

    const v = this.profileForm.value;
    const body = {
      userName:    v.userName    ?? '',
      email:       v.email       ?? '',
      name:        v.name        ?? '',
      surname:     v.surname     ?? '',
      phoneNumber: v.phoneNumber ?? ''
    };

    this.http.put<MyProfile>(this.api, body).subscribe({
      next: () => {
        this.profileOk.set(true);
        this.profileMsg.set('Profile updated successfully.');
        this.saving.set(false);
      },
      error: err => {
        this.profileOk.set(false);
        this.profileMsg.set(err?.error?.error?.message ?? `Update failed (${err.status})`);
        this.saving.set(false);
      }
    });
  }

  changePassword() {
    if (this.pwForm.invalid) return;
    this.changingPw.set(true);
    this.pwMsg.set('');
    const { currentPassword, newPassword } = this.pwForm.value;

    // ABP uses POST (not PUT) for change-password
    this.http.post(`${this.api}/change-password`, { currentPassword, newPassword }).subscribe({
      next: () => {
        this.pwOk.set(true);
        this.pwMsg.set('Password changed successfully.');
        this.pwForm.reset();
        this.changingPw.set(false);
      },
      error: err => {
        this.pwOk.set(false);
        this.pwMsg.set(err?.error?.error?.message ?? `Password change failed (${err.status})`);
        this.changingPw.set(false);
      }
    });
  }
}
