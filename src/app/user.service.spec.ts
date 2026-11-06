import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendPasswordReset', () => {
    it('should send POST request to correct endpoint', () => {
      const userId = 123;
      const mockResponse = { success: true };

      service.sendPasswordReset(userId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.api}/admin/send-password-reset/${userId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle error response', () => {
      const userId = 456;
      const mockError = { status: 403, statusText: 'Forbidden' };

      service.sendPasswordReset(userId).subscribe(
        () => fail('should have failed with 403 error'),
        (error) => {
          expect(error.status).toBe(403);
          expect(error.statusText).toBe('Forbidden');
        }
      );

      const req = httpMock.expectOne(`${environment.api}/admin/send-password-reset/${userId}`);
      req.flush('Forbidden', mockError);
    });

    it('should handle user not found error', () => {
      const userId = 999;
      const mockError = { status: 404, statusText: 'Not Found' };

      service.sendPasswordReset(userId).subscribe(
        () => fail('should have failed with 404 error'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${environment.api}/admin/send-password-reset/${userId}`);
      req.flush('User not found', mockError);
    });
  });
});
