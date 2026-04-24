import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) { inject(Router).navigate(['/login']); return false; }
  if (!auth.isAdmin())    { inject(Router).navigate(['/next-slots']); return false; }
  return true;
};
