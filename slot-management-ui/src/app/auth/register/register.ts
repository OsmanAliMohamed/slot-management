import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  form: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      username:   ['', [Validators.required, Validators.minLength(3)]],
      email:      ['', [Validators.required, Validators.email]],
      password:   ['', [Validators.required, Validators.minLength(6)]],
      confirm:    ['', Validators.required]
    });
    this.form.addValidators(this.passwordMatchValidator);
  }

  private passwordMatchValidator(c: AbstractControl): ValidationErrors | null {
    return c.get('password')?.value === c.get('confirm')?.value ? null : { mismatch: true };
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    const { username, email, password } = this.form.value;
    this.auth.register(username, email, password).subscribe({
      next: () => {
        this.success = 'Account created! Logging you in...';
        this.auth.login(username, password).subscribe({
          next: () => this.router.navigate(['/generate']),
          error: () => this.router.navigate(['/login'])
        });
      },
      error: (err) => {
        this.error = err.error?.error?.message ?? err.error?.message ?? 'Registration failed.';
        this.loading = false;
      }
    });
  }
}
