import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-header">
      <h1>My Profile</h1>
      <p class="subtitle">View and update your account details</p>
    </div>

    <!-- Profile card -->
    <div class="card">
      <h2 style="margin:0 0 1.25rem;font-size:1.1rem">Account Information</h2>

      @if (loadError()) {
        <div class="alert alert-danger">{{ loadError() }}</div>
      }

      @if (loading()) {
        <div class="loading">Loading profile…</div>
      } @else {
        @if (profileMsg()) {
          <div class="alert" [class.alert-success]="profileOk()" [class.alert-danger]="!profileOk()">
            {{ profileMsg() }}
          </div>
        }

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input class="form-control" formControlName="name" placeholder="First name" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input class="form-control" formControlName="surname" placeholder="Last name" />
            </div>
          </div>
          <div class="form-group">
            <label>Username</label>
            <input class="form-control" formControlName="userName" placeholder="Username" />
            @if (profileForm.get('userName')?.invalid && profileForm.get('userName')?.touched) {
              <span class="error">Username is required</span>
            }
          </div>
          <div class="form-group">
            <label>Email</label>
            <input class="form-control" type="email" formControlName="email" placeholder="Email" />
            @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
              <span class="error">Valid email is required</span>
            }
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input class="form-control" formControlName="phoneNumber" placeholder="Phone (optional)" />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="profileForm.invalid || saving()">
              {{ saving() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </form>
      }
    </div>

    <!-- Change password card -->
    <div class="card">
      <h2 style="margin:0 0 1.25rem;font-size:1.1rem">Change Password</h2>

      @if (pwMsg()) {
        <div class="alert" [class.alert-success]="pwOk()" [class.alert-danger]="!pwOk()">
          {{ pwMsg() }}
        </div>
      }

      <form [formGroup]="pwForm" (ngSubmit)="changePassword()">
        <div class="form-group">
          <label>Current Password</label>
          <input class="form-control" type="password" formControlName="currentPassword" />
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input class="form-control" type="password" formControlName="newPassword" />
          @if (pwForm.get('newPassword')?.hasError('minlength') && pwForm.get('newPassword')?.touched) {
            <span class="error">Password must be at least 6 characters</span>
          }
        </div>
        <div class="form-group">
          <label>Confirm New Password</label>
          <input class="form-control" type="password" formControlName="confirmPassword" />
          @if (pwForm.hasError('mismatch') && pwForm.get('confirmPassword')?.touched) {
            <span class="error">Passwords do not match</span>
          }
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit" [disabled]="pwForm.invalid || changingPw()">
            {{ changingPw() ? 'Updating…' : 'Change Password' }}
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
