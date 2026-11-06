import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { TranslateService } from '@ngx-translate/core';

import { AuthService } from './auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService, private translate: TranslateService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
          console.log('error ', err);
          if (err.status === 401 || err.status === 403 ) {
                // auto logout if 401 response returned from api
                this.authService.logout();
            }

          const body = err && err.error;
          const serverMessage = body && typeof body === 'object' ? body.message : (typeof body === 'string' && body.indexOf('<') === -1 ? body : '');
          let error = serverMessage || '';
          if (!err || err.status === 0) {
            error = this.translate.instant('admin.networkError');
          } else if (err.status >= 500 && (!serverMessage || serverMessage === 'UNKNOWN ERROR')) {
            error = this.translate.instant('admin.serverError');
          } else if (!error) {
            error = this.translate.instant('admin.requestFailed');
          }
          return throwError(error);
        }));
    }
}
