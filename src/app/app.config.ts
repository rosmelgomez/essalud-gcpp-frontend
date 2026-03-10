import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { auditoryInterceptor } from './interceptors/auditory-interceptor';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { APP_INITIALIZER } from '@angular/core';
import { RouteLogger } from './services/route-logger';

// Función para inicializar el RouteLogger
export function initRouteLogger(routeLogger: RouteLogger) {
  return () => routeLogger;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([auditoryInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initRouteLogger,
      deps: [RouteLogger],
      multi: true
    }
  ],
};
