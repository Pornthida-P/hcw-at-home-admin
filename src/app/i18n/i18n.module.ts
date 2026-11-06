import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export const ADMIN_LANGUAGES = ['en', 'th'];
export const ADMIN_LANG_STORAGE_KEY = 'hcw-admin-lang';

export function getAdminLanguage(): string {
  let lang = '';
  try {
    lang = window.localStorage.getItem(ADMIN_LANG_STORAGE_KEY) || '';
  } catch (e) {}
  if (!lang && window.navigator && window.navigator.language) {
    lang = window.navigator.language.slice(0, 2);
  }
  return ADMIN_LANGUAGES.indexOf(lang) > -1 ? lang : 'en';
}

export function translateLoaderFactory(http: HttpClient) {
  const baseTag = document.getElementsByTagName('base')[0];
  const baseHref = baseTag && baseTag.href ? baseTag.href : '/';
  const prefix =
    baseHref.charAt(baseHref.length - 1) === '/'
      ? baseHref + 'assets/i18n/'
      : baseHref + '/assets/i18n/';
  return new TranslateHttpLoader(http, prefix, '.json');
}

@NgModule({
  imports: [
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [TranslateModule],
})
export class I18nModule {
  constructor(translate: TranslateService) {
    translate.setDefaultLang('en');
    translate.use(getAdminLanguage());
  }
}
