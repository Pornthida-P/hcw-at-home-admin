import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TranslatedMatPaginatorIntl extends MatPaginatorIntl {
  private ofLabel = 'of';

  constructor(private translate: TranslateService) {
    super();
    this.translate.onLangChange.subscribe(() => this.applyLabels());
    this.applyLabels();
  }

  private applyLabels() {
    this.itemsPerPageLabel = this.translate.instant('admin.paginatorItemsPerPage');
    this.nextPageLabel = this.translate.instant('admin.paginatorNextPage');
    this.previousPageLabel = this.translate.instant('admin.paginatorPreviousPage');
    this.firstPageLabel = this.translate.instant('admin.paginatorFirstPage');
    this.lastPageLabel = this.translate.instant('admin.paginatorLastPage');
    this.ofLabel = this.translate.instant('admin.paginatorOf');
    this.changes.next();
  }

  getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 ${this.ofLabel} ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return `${startIndex + 1} – ${endIndex} ${this.ofLabel} ${length}`;
  };
}
