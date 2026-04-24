import { Injectable, signal, computed } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

type Lang = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class LangService {
  private _lang = signal<Lang>((localStorage.getItem('lang') as Lang) ?? 'en');
  readonly lang  = this._lang.asReadonly();
  readonly isRtl = computed(() => this._lang() === 'ar');

  constructor(private translate: TranslateService) {
    translate.addLangs(['en', 'ar']);
    translate.setDefaultLang('en');
    this.applyLang(this._lang());
  }

  toggle(): void {
    this.setLang(this._lang() === 'en' ? 'ar' : 'en');
  }

  setLang(lang: Lang): void {
    this._lang.set(lang);
    localStorage.setItem('lang', lang);
    this.applyLang(lang);
  }

  private applyLang(lang: Lang): void {
    this.translate.use(lang);
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}
