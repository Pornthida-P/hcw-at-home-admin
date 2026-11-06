import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { UserDetailComponent } from './user-detail.component';
import { UserService } from '../user.service';
import { QueueService } from '../queue.service';

describe('UserDetailComponent', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let queueService: jasmine.SpyObj<QueueService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let translate: TranslateService;

  beforeEach(async(() => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['findOne', 'getUserQueuesById', 'sendPasswordReset', 'update', 'addDoctorToQueue', 'removeDoctorToQueue']);
    const queueServiceSpy = jasmine.createSpyObj('QueueService', ['find']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      declarations: [ UserDetailComponent ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: QueueService, useValue: queueServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
    .compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    queueService = TestBed.inject(QueueService) as jasmine.SpyObj<QueueService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    translate = TestBed.inject(TranslateService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
    
    // Mock user data
    component.user = {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    } as any;
    component.userId = '1';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('sendPasswordReset', () => {
    it('should not send request if isSendingPasswordReset is true', () => {
      component.isSendingPasswordReset = true;
      component.sendPasswordReset();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should not send request if user is null', () => {
      component.user = null;
      component.sendPasswordReset();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should open confirmation dialog with correct data', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ event: 'Cancel' }));
      dialog.open.and.returnValue(dialogRefSpy);

      component.sendPasswordReset();

      expect(dialog.open).toHaveBeenCalled();
      const dialogConfig = dialog.open.calls.first().args[1];
      expect(dialogConfig.width).toBe('400px');
    });

    it('should send password reset when user confirms', (done) => {
      const mockResponse = { success: true };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      
      translate.instant = jasmine.createSpy().and.returnValue('Send Password Reset Link');
      dialogRefSpy.afterClosed.and.returnValue(of({ event: 'Send Password Reset Link' }));
      dialog.open.and.returnValue(dialogRefSpy);
      userService.sendPasswordReset.and.returnValue(of(mockResponse));

      component.sendPasswordReset();

      setTimeout(() => {
        expect(userService.sendPasswordReset).toHaveBeenCalledWith('1');
        expect(snackBar.open).toHaveBeenCalled();
        expect(component.isSendingPasswordReset).toBe(false);
        done();
      }, 100);
    });

    it('should handle forbidden error (403)', (done) => {
      const mockError = { status: 403, error: { message: 'forbidden' } };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      
      translate.instant = jasmine.createSpy().and.returnValue('Send Password Reset Link');
      dialogRefSpy.afterClosed.and.returnValue(of({ event: 'Send Password Reset Link' }));
      dialog.open.and.returnValue(dialogRefSpy);
      userService.sendPasswordReset.and.returnValue(throwError(mockError));

      component.sendPasswordReset();

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalled();
        expect(component.isSendingPasswordReset).toBe(false);
        done();
      }, 100);
    });

    it('should handle user not found error (404)', (done) => {
      const mockError = { status: 404, error: { message: 'user-not-found' } };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      
      translate.instant = jasmine.createSpy().and.returnValue('Send Password Reset Link');
      dialogRefSpy.afterClosed.and.returnValue(of({ event: 'Send Password Reset Link' }));
      dialog.open.and.returnValue(dialogRefSpy);
      userService.sendPasswordReset.and.returnValue(throwError(mockError));

      component.sendPasswordReset();

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalled();
        expect(component.isSendingPasswordReset).toBe(false);
        done();
      }, 100);
    });

    it('should handle rate limit error (429)', (done) => {
      const mockError = { status: 429, error: { message: 'rate-limit' } };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      
      translate.instant = jasmine.createSpy().and.returnValue('Send Password Reset Link');
      dialogRefSpy.afterClosed.and.returnValue(of({ event: 'Send Password Reset Link' }));
      dialog.open.and.returnValue(dialogRefSpy);
      userService.sendPasswordReset.and.returnValue(throwError(mockError));

      component.sendPasswordReset();

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalled();
        expect(component.isSendingPasswordReset).toBe(false);
        done();
      }, 100);
    });

    it('should handle server error (500)', (done) => {
      const mockError = { status: 500, error: { message: 'server-error' } };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      
      translate.instant = jasmine.createSpy().and.returnValue('Send Password Reset Link');
      dialogRefSpy.afterClosed.and.returnValue(of({ event: 'Send Password Reset Link' }));
      dialog.open.and.returnValue(dialogRefSpy);
      userService.sendPasswordReset.and.returnValue(throwError(mockError));

      component.sendPasswordReset();

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalled();
        expect(component.isSendingPasswordReset).toBe(false);
        done();
      }, 100);
    });

    it('should not send request when user cancels dialog', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ event: 'Cancel' }));
      dialog.open.and.returnValue(dialogRefSpy);

      component.sendPasswordReset();

      expect(userService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });
});
