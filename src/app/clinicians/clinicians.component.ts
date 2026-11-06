import {Subscription} from 'rxjs';
import {UserService} from './../user.service';
import {Component, OnInit, ViewChild, OnDestroy} from '@angular/core';
import {User} from '../types/user';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {MatSlideToggleChange} from "@angular/material/slide-toggle";
import {TranslateService} from '@ngx-translate/core';
import {MatDialog} from '@angular/material/dialog';
import {DialogBoxComponent} from '../dialog-box/dialog-box.component';

@Component({
  selector: 'app-clinicians',
  templateUrl: './clinicians.component.html',
  styleUrls: ['./clinicians.component.scss'],
})
export class CliniciansComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  users: User[] = [];
  loading = false;
  error;

  displayedColumns: string[] = ['firstName', 'lastName', 'email', 'phoneNumber', 'organization', 'country', 'status'];
  dataSource = new MatTableDataSource<User>(this.users);

  count = 0;
  pageIndex = 0;
  pageSize = '10';
  pageSizeOptions = ['10', '50', '100'];
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    private userService: UserService,
    private router: Router,
    private translate: TranslateService,
    public dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.getClinitians();
    /* this.countUsers();*/
    this.dataSource.paginator = this.paginator;
    //this.getUsersByPage(this.pageSize, this.pageIndex);
  }

  getClinitians() {
    this.loading = true;
    this.subscriptions.push(
      this.userService.find({role: 'nurse'}).subscribe(
        (res) => {
          this.users = (res || []).map((user) => this.decodeUserFields(user));
          // this.count = res.totalCount;
          this.dataSource.data = this.users;
          this.loading = false;
        },
        (err) => {
          this.loading = false;
          this.error = err;
        }
      )
    );
  }

  /* useful if multiple role managed filterByRole(role) {
    console.log(role);
    if (role) {
      this.dataSource.data = this.users.filter(user => user.role == role);

    } else {
      this.dataSource.data = this.users;
    }
  }*/

  selectUser(user) {
    this.router.navigate(['/user', user.id]);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  countUsers() {
    // this.loading = true;
    this.subscriptions.push(
      this.userService.find().subscribe(
        (res) => {
          // this.count = res.totalCount;
          console.log('total length', this.count);
          this.loading = false;
        },
        (err) => {
          this.loading = false;
          this.error = err;
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  pageChange(event) {
    /* useful for dynamic pagination console.log('page changed length', event);
     console.log('page changed limit', event.pageSize);
     console.log('page changed skip', event.pageIndex);
     this.pageSize = event.pageSize;
     this.pageIndex = event.pageIndex;
     this.getUsersByPage(this.pageSize, this.pageIndex);*/
  }

  decodeUserFields(user: User): User {
    const decoded: any = { ...user };
    ['firstName', 'lastName', 'phoneNumber', 'organization', 'country'].forEach((field) => {
      if (typeof decoded[field] === 'string' && decoded[field].indexOf('&') > -1) {
        decoded[field] = new DOMParser().parseFromString(decoded[field], 'text/html').documentElement.textContent;
      }
    });
    return decoded;
  }

  deleteUser(user) {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '250px',
      data: { action: 'Delete', name },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.event === 'Delete') {
        this.userService.delete(user).subscribe(
          (res) => {
            this.getClinitians();
          },
          (err) => {
            this.error = err;
          }
        );
      }
    });
  }

  /* useful for dynamic pagination getUsersByPage(limit, skip) {
// this.loading = true;
this.subscriptions.push(
  this.userService.getUsersByPage(limit, skip).subscribe(
    (res) => {
      console.log("getUsersByPage totalcount", res.totalCount)
      this.count = res.totalCount;
      this.users = res.results;
      this.dataSource.data = this.users;

      this.loading = false;

    },
    (err) => {
      this.loading = false;
      this.error = err;
    }
  )
);
}*/

  onToggle(event: MatSlideToggleChange, user: any) {
    const {checked} = event;
    this.userService.updateUserStatus(user.id, checked ? 'approved' : 'not-approved')
      .subscribe({
        next: (res) => {
          this.getClinitians();
        }, error: (err) => {
          console.log(err, 'err');
        }
      })
    console.log(event, 'event');
  }
}
