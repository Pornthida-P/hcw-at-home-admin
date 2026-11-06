import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormArray, Validators, FormControl, FormGroupDirective, NgForm, AbstractControl, ValidationErrors} from '@angular/forms';
import {MediasoupserverService} from "../services/mediasoupserver.service";
import {ErrorStateMatcher} from "@angular/material/core";
import {MatDialog} from "@angular/material/dialog";
import {DialogBoxComponent} from "../dialog-box/dialog-box.component";
import {TranslateService} from "@ngx-translate/core";

/**
 * Accept any http(s) URL with a host, including hosts without a TLD
 * (https://localhost:3443, https://mediasoup:3443, https://10.1.1.101:3443).
 */
export function mediasoupUrlValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value || '').trim();
  if (!value) {
    return null; // handled by Validators.required
  }
  if (/\s/.test(value)) {
    return { pattern: true };
  }
  try {
    const url = new URL(value);
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname) {
      return null;
    }
  } catch (e) {
    // invalid
  }
  return { pattern: true };
}

export class FormErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

@Component({
  selector: 'app-mediasoup',
  templateUrl: './mediasoup.component.html',
  styleUrls: ['./mediasoup.component.scss']
})

export class MediasoupComponent implements OnInit {
  configForm: FormGroup;
  matcher = new FormErrorStateMatcher();
  // Per-row save feedback
  saveErrors: { [index: number]: string } = {};
  saving: { [index: number]: boolean } = {};
  showSecret: { [index: number]: boolean } = {};
  loaded = false;
  // Last saved values of each existing row, used by Cancel to revert edits
  private savedValues = new Map<AbstractControl, any>();

  constructor(private fb: FormBuilder,
              private mediasoupserverService: MediasoupserverService,
              public dialog: MatDialog,
              private translate: TranslateService) {
  }

  ngOnInit() {
    this.configForm = this.fb.group({
      configs: this.fb.array([])
    });

    this.loadConfigs();
  }

  get configs() {
    return this.configForm.get('configs') as FormArray;
  }

  loadConfigs() {
    this.mediasoupserverService.getConfig().subscribe(servers => {
      this.loaded = true;
      for (let server of servers) {
        const config = this.fb.group({
          url: [server.url, [Validators.required,
            mediasoupUrlValidator
          ]],
          username: [server.username, [Validators.required]],
          password: [server.password, [Validators.required]],
          maxNumberOfSessions: [server.maxNumberOfSessions, [Validators.required, Validators.min(1), Validators.max(1000)]],
          id: [server.id, Validators.required],
          active: [server.active]
        });
        this.savedValues.set(config, config.getRawValue());
        this.configs.push(config);
      }
    });
  }

  addConfig() {
    const config = this.fb.group({
      url: ['', [Validators.required,
        mediasoupUrlValidator]
      ],
      username: ['', Validators.required],
      password: ['', Validators.required],
      maxNumberOfSessions: ['', [Validators.required, Validators.min(1), Validators.max(1000)]],
      active: [true]
    });
    this.configs.push(config);
  }

  deleteConfig(index: number) {
    const group = this.configs.at(index);
    const dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '250px',
      data: { action: 'Delete', name: group.get('url')?.value || this.translate.instant('admin.mediasoupThisServer') },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || result.event !== 'Delete') {
        return;
      }
      const rowIndex = this.configs.controls.indexOf(group);
      if (rowIndex < 0) {
        return;
      }
      const configId = group.get('id')?.value;
      if (configId) {
        this.saveErrors[rowIndex] = '';
        this.mediasoupserverService.delete(configId).subscribe(() => {
          const currentIndex = this.configs.controls.indexOf(group);
          if (currentIndex > -1) {
            this.removeRow(currentIndex);
          }
        }, () => {
          const currentIndex = this.configs.controls.indexOf(group);
          if (currentIndex > -1) {
            this.saveErrors[currentIndex] = 'admin.mediasoupDeleteError';
          }
        });
      } else {
        this.removeRow(rowIndex);
      }
    });
  }

  isNew(index: number): boolean {
    return !this.configs.at(index).get('id')?.value;
  }

  canCancel(index: number): boolean {
    const group = this.configs.at(index);
    return this.isNew(index) || group.dirty || !!this.saveErrors[index];
  }

  /**
   * New unsaved row: remove it. Existing row: revert to the last saved
   * values and leave edit mode (pristine, no errors shown).
   */
  cancel(index: number) {
    if (this.isNew(index)) {
      this.removeRow(index);
      return;
    }
    const group = this.configs.at(index) as FormGroup;
    const saved = this.savedValues.get(group);
    if (saved) {
      group.reset(saved);
    }
    group.markAsPristine();
    group.markAsUntouched();
    delete this.saveErrors[index];
  }

  /** Removes a row and keeps the per-row feedback aligned with the rows */
  private removeRow(index: number) {
    const group = this.configs.at(index);
    this.savedValues.delete(group);
    this.configs.removeAt(index);
    const shift = (map: { [index: number]: any }) => {
      const result = {};
      Object.keys(map).forEach(key => {
        const i = Number(key);
        if (i < index) {
          result[i] = map[key];
        } else if (i > index) {
          result[i - 1] = map[key];
        }
      });
      return result;
    };
    this.saveErrors = shift(this.saveErrors);
    this.saving = shift(this.saving);
    this.showSecret = shift(this.showSecret);
  }

  save(index: number) {
    const group = this.configs.at(index) as FormGroup;
    this.saveErrors[index] = '';
    if (group.invalid) {
      // Do not send an invalid form, show the field errors instead
      group.markAllAsTouched();
      this.saveErrors[index] = 'admin.mediasoupFormInvalid';
      return;
    }
    const values = { ...group.value, url: (group.value.url || '').trim().replace(/\/+$/, '') };
    const onSuccess = () => {
      this.saving[index] = false;
      this.saveErrors = {};
      this.showSecret = {};
      this.savedValues.clear();
      this.loaded = false;
      this.configForm = this.fb.group({
        configs: this.fb.array([])
      });
      this.loadConfigs();
    };
    const onError = (err) => {
      this.saving[index] = false;
      const details = err?.error?.message || err?.error?.error || err?.error?.details || err?.message || '';
      this.saveErrors[index] = typeof details === 'string' && details ? details : 'admin.mediasoupSaveError';
    };
    this.saving[index] = true;

    if (values.id) {
      const configId = group.get('id').value;
      this.mediasoupserverService.update(configId, values).subscribe(onSuccess, onError);
    } else {
      delete values.id;
      this.mediasoupserverService.create(values).subscribe(onSuccess, onError);
    }
  }
}
