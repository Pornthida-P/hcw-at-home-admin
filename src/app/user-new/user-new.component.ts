import { TranslateService } from '@ngx-translate/core';
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
    private location: Location,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    console.log("init new user")
  }

  createUser(user) {
    console.log("userDetail", user);
    this.loading = true;
    this.error = '';
    this.userService.create(user).subscribe(
      (res) => {
        console.log(res);
        this.loading = false;
        this.location.back();
      },
      (err) => {
        console.log(err);
        this.loading = false;
        this.error = this.mapUserError(err);
      });
  }



  private mapUserError(err: any): string {
    const raw = typeof err === 'string' ? err : (err && (err.message || err.error || err)) || '';
    const text = String(raw);
    if (/email already/i.test(text) || /already in use/i.test(text) || /already used/i.test(text)) {
      return this.translate.instant('admin.emailAlreadyUsed');
    }
    return text;
  }
}
