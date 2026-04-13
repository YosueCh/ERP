import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el servidor responde con 401 y el código es de cuenta inactiva
      if (
        error.status === 401 &&
        error.error?.intOpCode === 'SxGW401_INACTIVE'
      ) {
        authService.handleDeactivated();
      }
      return throwError(() => error);
    })
  );
};