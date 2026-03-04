import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-user-new',
  templateUrl: './user-new.component.html',
  styleUrls: ['./user-new.component.scss']
})
export class UserNewComponent implements OnInit {
  loading = false;
  error = '';

  constructor(private userService: UserService,
    private location: Location
  ) { }

  ngOnInit(): void {
    console.log("init new user")
  }

  createUser(payload: { user: any; initialPassword?: string }) {
    if (this.loading) return;
    this.error = '';
    const user = payload?.user;
    const email = (user?.email || '').trim().toLowerCase();
    if (!email) return;

    this.loading = true;
    this.userService.find({ email }).subscribe(
      (existing) => {
        if (existing && existing.length > 0) {
          this.loading = false;
          this.error = 'admin.emailAlreadyUsed';
          return;
        }
        this.doCreate(user, payload.initialPassword);
      },
      () => {
        this.loading = false;
        this.doCreate(user, payload.initialPassword);
      }
    );
  }

  private doCreate(user: any, initialPassword?: string) {
    const body = initialPassword ? { ...user, password: initialPassword } : user;
    this.userService.create(body).subscribe(
      () => {
        this.loading = false;
        this.location.back();
      },
      (err) => {
        this.loading = false;
        const msg = err?.error?.message || err?.error?.error || err?.message || 'admin.createUserError';
        this.error = typeof msg === 'string' && msg.includes('already') ? 'admin.emailAlreadyUsed' : (typeof msg === 'string' ? msg : 'admin.createUserError');
      }
    );
  }
}
