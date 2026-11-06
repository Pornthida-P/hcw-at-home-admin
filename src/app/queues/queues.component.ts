import { QueueService } from './../queue.service';
import { Queue } from './../queue';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DialogBoxComponent } from '../dialog-box/dialog-box.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-queues',
  templateUrl: './queues.component.html',
  styleUrls: ['./queues.component.scss'],
})
export class QueuesComponent implements OnInit {
  // subscriptions: Subscription[] = [];
  queues: Queue[] = [];
  loading = false;
  error;
  displayedColumns: string[] = ['name', 'action'];
  dataSource = new MatTableDataSource<Queue>(this.queues);
  count = 0;
  newQueueName = '';
  @ViewChild('scheduledOrdersPaginator') paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private queueService: QueueService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getQueues();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
  getQueues() {
    this.loading = true;
    this.queueService.find().subscribe(
      (res) => {
        this.queues = res;
        this.dataSource.data = this.queues;
        // this.count = res.totalCount;
        this.loading = false;
      },
      (err) => {
        this.loading = false;
        this.error = err;
      }
    );
  }
  selectQueue(queue) {
    console.log(queue);
  }
  pageChange(event: Event) {
    console.log('page changed ');
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  deleteQueue(queue) {
    const dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '250px',
      data: { action: 'Delete', name: queue.name },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.event === 'Delete') {
        this.error = '';
        this.queueService.delete(queue).subscribe(
          (res) => {
            this.getQueues();
          },
          (err) => {
            this.error = err;
          }
        );
      }
    });
  }

  deleteRowData(row_obj) {
    this.queues = this.queues.filter((value, key) => {
      return value.id != row_obj.id;
    });
  }

  createQueue() {
    console.log(this.newQueueName);
    this.error = '';
    if (!this.newQueueName || !this.newQueueName.trim()) {
      this.error = this.translate.instant('admin.queueNameRequired');
      return;
    }
    if (this.isDuplicateName(this.newQueueName)) {
      this.error = this.translate.instant('admin.queueNameExists');
      return;
    }
    this.queueService.create({ name: this.newQueueName.replace(/\s+/g, ' ').trim() }).subscribe(
      (res) => {
        this.newQueueName = '';
        this.getQueues();
      },
      (err) => {
        this.error = this.queueErrorMessage(err);
      }
    );
  }
  openDialog(action, obj) {
    obj.action = action;
    const dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '250px',
      data: obj,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.event == 'Update') {
        this.error = '';
        if (!result.data.name || !result.data.name.trim()) {
          this.error = this.translate.instant('admin.queueNameRequired');
          return;
        }
        if (this.isDuplicateName(result.data.name, result.data.id)) {
          this.error = this.translate.instant('admin.queueNameExists');
          return;
        }
        this.queueService.updateQueue(result.data.id, result.data.name.replace(/\s+/g, ' ').trim()).subscribe(
          (res) => {
            this.getQueues();
          },
          (err) => {
            this.error = this.queueErrorMessage(err);
          }
        );
      }
    });
  }

  private normalizeQueueName(name: string): string {
    return (name || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  isDuplicateName(name: string, ignoreId?: string): boolean {
    const normalized = this.normalizeQueueName(name);
    return this.queues.some(
      (queue) => queue.id !== ignoreId && this.normalizeQueueName(queue.name) === normalized
    );
  }

  queueErrorMessage(err) {
    const raw = typeof err === 'string'
      ? err
      : (err && (err.message || err.error || err.details)) || '';
    const text = String(raw);
    if (text.indexOf('QUEUE_NAME_EXISTS') > -1 || text.toLowerCase().indexOf('already exists') > -1) {
      return this.translate.instant('admin.queueNameExists');
    }
    return typeof err === 'string' ? err : text || err;
  }
}
