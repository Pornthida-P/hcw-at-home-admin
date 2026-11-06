import { TranslateService } from '@ngx-translate/core';
import { QueueService } from './../queue.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../types/user';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxComponent } from '../dialog-box/dialog-box.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
  user: User;
  loading: boolean;
  loadingUserQueue: boolean;
  loadingAllQueues: boolean;
  isAddingQueues = false;
  isRemovingQueues = false;
  isSendingPasswordReset = false;
  error;
  updateError = '';
  userId;
  allQueues: any[];
  allowedQueues: any;
  queuesNotAllowed = [];
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private queueService: QueueService,
    private location: Location,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.userService.findOne(this.userId).subscribe(
      (res) => {
        this.user = res;
        // this.dataSource = new MatTableDataSource<User>(this.users);

        this.loading = false;
      },
      (err) => {
        this.loading = false;
        this.error = this.mapUserError(err);
      }
    );
    this.getUserQueues();
  }
  addQueueToUser(queueId) {}
  removeQueueToUser(queueId) {}
  getUserQueues() {
    this.loadingUserQueue = true;

    this.userService.getUserQueuesById(this.userId).subscribe(
      (res) => {
        this.allowedQueues = res;
        console.log('allowedQueues', this.allowedQueues);

        this.getAllQueues();
        this.loadingUserQueue = false;
      },
      (err) => {
        this.loadingUserQueue = false;
        this.error = this.mapUserError(err);
      }
    );
  }

  getAllQueues() {
    this.loadingAllQueues = true;
    this.queueService.find().subscribe(
      (res) => {
        console.log('get all queues', res);
        this.allQueues = res;
        this.loadingAllQueues = false;
        this.filterQueuesNotAllowed();
      },
      (err) => {
        this.loading = false;
        this.error = this.mapUserError(err);
      }
    );
  }

  filterQueuesNotAllowed() {
    let queuesIds = this.allowedQueues.map(function (e) {
      return e.id;
    });
    this.queuesNotAllowed = this.allQueues.filter((queue) => {
      //if id not found in the allowedQueues of the user it means that this queue isn't allowed.
      return queuesIds.indexOf(queue.id) < 0;
    });
    console.log('queuesNotAllowed', this.queuesNotAllowed);
  }
  selectQueueToRemove(queue) {
    queue.checked = !queue.checked;
  }
  selectQueueToAdd(queue) {
    queue.checked = !queue.checked;
  }
  addQueue() {
    let queuesToAdd = this.queuesNotAllowed.filter((q) => q.checked).map((q) => q.id);
    if (!queuesToAdd || queuesToAdd.length == 0 || this.isAddingQueues) return;
    console.log(queuesToAdd);
    this.isAddingQueues = true;
    this.error = '';
    this.userService.addDoctorToQueue(this.user.id, queuesToAdd).subscribe(
      (res) => {
        console.log(res);
        this.isAddingQueues = false;
        this.getUserQueues();
      },
      (err) => {
        console.log(err);
        this.isAddingQueues = false;
        this.error = this.mapUserError(err);
      }
    );
  }

  removeQueue() {
    let queuesToRemove = this.allowedQueues.filter((q) => q.checked).map((q) => q.id);
    if (!queuesToRemove || queuesToRemove.length == 0 || this.isRemovingQueues) return;
    this.isRemovingQueues = true;
    this.error = '';
    this.userService.removeDoctorToQueue(this.user.id, queuesToRemove).subscribe(
      (res) => {
        console.log(res);
        this.isRemovingQueues = false;
        this.getUserQueues();
      },
      (err) => {
        console.log(err);
        this.isRemovingQueues = false;
        this.error = this.mapUserError(err);
      }
    );
  }
  updateUser() {
    console.log('userDetail', this.user);
    this.updateError = '';
    this.userService.update(this.userId, this.user).subscribe(
      (res) => {
        console.log(res);
        this.location.back();
      },
      (err) => {
        console.log(err);
        this.updateError = this.mapUserError(err);
      }
    );
  }

  private mapUserError(err: any): string {
    const raw = typeof err === 'string' ? err : (err && (err.message || err.error || err)) || '';
    const text = String(raw);
    if (/email already/i.test(text) || /already in use/i.test(text) || /already used/i.test(text)) {
      return this.translate.instant('admin.emailAlreadyUsed');
    }
    return text;
  }

  sendPasswordReset() {
    if (this.isSendingPasswordReset || !this.user) {
      return;
    }

    const name = `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || this.user.email || this.translate.instant('admin.unknown');
    
    const confirmMessage = this.translate.instant('admin.sendPasswordResetConfirm', { name });
    const confirmBody = this.translate.instant('admin.sendPasswordResetConfirmBody');
    
    const dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '400px',
      data: { 
        action: this.translate.instant('admin.sendPasswordReset'), 
        name: confirmMessage,
        message: confirmBody
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.event === this.translate.instant('admin.sendPasswordReset')) {
        this.isSendingPasswordReset = true;
        
        this.userService.sendPasswordReset(this.userId).subscribe(
          (res) => {
            this.isSendingPasswordReset = false;
            if (res && res.success) {
              this.snackBar.open(
                this.translate.instant('admin.sendPasswordResetSuccess'),
                '',
                { duration: 5000, panelClass: ['success-snackbar'] }
              );
            }
          },
          (err) => {
            this.isSendingPasswordReset = false;
            const errorMsg = this.mapPasswordResetError(err);
            this.snackBar.open(
              errorMsg,
              '',
              { duration: 7000, panelClass: ['error-snackbar'] }
            );
          }
        );
      }
    });
  }

  private mapPasswordResetError(err: any): string {
    // Backend returns error responses as { message: 'error-code' }
    const errorMessage = err?.error?.message || err?.message || '';
    const statusCode = err?.status || 0;
    
    // Map backend error codes from AuthController.sendPasswordReset
    switch (errorMessage) {
      case 'forbidden':
        return this.translate.instant('admin.adminOnly');
      case 'user-not-found':
        return this.translate.instant('admin.sendPasswordResetError') + ': ' + this.translate.instant('admin.unknown');
      case 'invalid-role':
        return this.translate.instant('admin.sendPasswordResetError') + ': ' + this.translate.instant('admin.roleRequired');
      case 'userId-required':
        return this.translate.instant('admin.sendPasswordResetError');
      case 'server-error':
        return this.translate.instant('admin.sendPasswordResetServerError');
      default:
        break;
    }
    
    // Handle rate limiting (429 status)
    if (statusCode === 429) {
      return this.translate.instant('admin.sendPasswordResetRateLimit');
    }
    
    // Handle network errors
    if (statusCode === 0 || statusCode >= 500) {
      return this.translate.instant('admin.sendPasswordResetServerError');
    }
    
    return this.translate.instant('admin.sendPasswordResetError');
  }
}
