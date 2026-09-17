import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { provideState, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { sessionFeature } from './core/sessions/state/session.reducer';
import { SessionEffects } from './core/sessions/state/session.effects';
import { feedbackBytesFeature } from './core/feedback-bytes/state/feedback-bytes.reducer';
import { FeedbackBytesEffects } from './core/feedback-bytes/state/feedback-bytes.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(),
    provideState(sessionFeature),
    provideState(feedbackBytesFeature),
    provideEffects(SessionEffects, FeedbackBytesEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
