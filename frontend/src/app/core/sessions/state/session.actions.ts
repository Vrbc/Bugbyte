import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { EndSessionRequest, TestSession } from '../sessions.models';

export const sessionActions = createActionGroup({
  source: 'Session',
  events: {
    'Load Session': props<{ sessionId: string }>(),
    'Load Session Success': props<{ session: TestSession }>(),
    'Load Session Failure': props<{ error: string }>(),

    'Pause Session': props<{ sessionId: string }>(),
    'Pause Session Success': props<{ session: TestSession }>(),
    'Pause Session Failure': props<{ error: string }>(),

    'Resume Session': props<{ sessionId: string }>(),
    'Resume Session Success': props<{ session: TestSession }>(),
    'Resume Session Failure': props<{ error: string }>(),

    'End Session': props<{ sessionId: string; request: EndSessionRequest }>(),
    'End Session Success': props<{ session: TestSession }>(),
    'End Session Failure': props<{ error: string }>(),

    'Session Updated': props<{ session: TestSession }>(),
    'Session Cleared': emptyProps(),
  },
});
