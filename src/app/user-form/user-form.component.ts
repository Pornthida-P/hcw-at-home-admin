import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../types/user';
import { FormBuilder, FormControl, Validators, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Role } from '../types/role';

function normalizePhone(value: string) {
  if (!value) {
    return value;
  }
  const compact = value.replace(/\s+/g, '');
  if (/^0\d{9}$/.test(compact)) {
    return '+66' + compact.substring(1);
  }
  return compact;
}

function thaiOrInternationalPhone(control: FormControl) {
  const value = (control.value || '').replace(/\s+/g, '');
  if (!value || /^\+[0-9]+$/.test(value) || /^0\d{9}$/.test(value)) {
    return null;
  }
  return { pattern: true };
}

// Staff accounts log in with their e-mail, so it is required for them
const STAFF_ROLES = ['doctor', 'admin', 'nurse', 'scheduler'];
// Roles an admin can give from this form (patients, nurses, guests... are created by invites or the patient app)
const ADMIN_CREATABLE_ROLES = [Role.doctor, Role.admin, Role.scheduler];

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  @Input() user: User;
  // Named "submitted" (not "change") so that native DOM "change" events that
  // bubble from the inputs are not taken for a form submission.
  @Output() submitted: EventEmitter<User> = new EventEmitter<User>();

  myForm;
  matcher = new MyErrorStateMatcher();
  roleOptions: string[] = [...ADMIN_CREATABLE_ROLES];
  emailRequired = true;
  @Input() loading = false;
  @Input() error = '';
  constructor(private formBuilder: FormBuilder,
    private location: Location,
    private router: Router

  ) {

  }

  ngOnInit(): void {
    console.log("[ngOnInit] user", this.user)
    if (!this.user) {
      this.user = {} as User;
    }
    this.createFormGroup();

  }

  ngAfterViewInit(): void {
    console.log("[ngOnInitView] user", this.user)
    if (!this.user) {
      this.user = {} as User;
    }
    this.createFormGroup();
  }

  createFormGroup() {
    // Only a NEW user defaults to the doctor role; editing must keep the
    // existing role (admin, scheduler, nurse...) instead of forcing "doctor".
    if (!this.user.role) {
      this.user.role = Role.doctor;
    }
    // keep the current role selectable when editing an account with another role
    this.roleOptions = [...ADMIN_CREATABLE_ROLES];
    if (!this.roleOptions.includes(this.user.role)) {
      this.roleOptions.push(this.user.role);
    }
    this.emailRequired = STAFF_ROLES.includes(this.user.role);
    const emailValidators = this.emailRequired
      ? [Validators.required, Validators.email]
      : [Validators.email];
    this.myForm = this.formBuilder.group({
      emailFormControl: new FormControl(this.user.email, emailValidators),
      phoneNumberFormControl: new FormControl(this.user.phoneNumber, [thaiOrInternationalPhone]),
      firstNameFormControl: new FormControl(this.user.firstName, [Validators.required]),
      lastNameFormControl: new FormControl(this.user.lastName, [Validators.required]),
      roleFormControl: new FormControl(this.user.role, [Validators.required]),
      functionFormControl: new FormControl(this.user._function),
      departmentFormControl: new FormControl(this.user.department),
      viewAllQueuesFormControl: new FormControl(this.user.viewAllQueues),
      authPhoneNumberFormControl: new FormControl(this.user.authPhoneNumber, [thaiOrInternationalPhone]),
      genderFormControl: new FormControl(this.user.gender),

      // genderFormControl: new FormControl(false),

      // our custom validator
    }, {});
    this.myForm.controls.emailFormControl.valueChanges.subscribe(() => {
      this.error = '';
    });
    (window as any).myForm = this.myForm;
  }

  onRoleChange() {
    this.emailRequired = STAFF_ROLES.includes(this.user.role);
    const emailControl = this.myForm.controls.emailFormControl;
    emailControl.setValidators(this.emailRequired ? [Validators.required, Validators.email] : [Validators.email]);
    emailControl.updateValueAndValidity();
  }

  cancel() {
    this.location.back();
  }

  onSubmit() {
    if (this.myForm.invalid) {
      this.myForm.markAllAsTouched();
      return;
    }
    this.user.phoneNumber = normalizePhone(this.user.phoneNumber);
    this.user.authPhoneNumber = normalizePhone(this.user.authPhoneNumber);
    this.submitted.emit(this.user);
  }
}
