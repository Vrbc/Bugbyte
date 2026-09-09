import { Injectable, inject } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { FeedbackByte } from '../feedback-bytes/feedback-bytes.models';
import { TestSession } from '../sessions/sessions.models';

interface JoinSessionResponse {
  success: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class SessionSocketService {
  private readonly authService = inject(AuthService);
  private socket: Socket | null = null;

  joinSession(sessionId: string): void {
    this.ensureConnected().emit(
      'joinSession',
      { sessionId },
      (response: JoinSessionResponse) => {
        if (!response?.success) {
          console.warn('Failed to join session room:', response?.message);
        }
      },
    );
  }

  leaveSession(sessionId: string): void {
    this.socket?.emit('leaveSession', { sessionId });
  }

  onNewFeedback(): Observable<FeedbackByte> {
    return fromEvent<FeedbackByte>(this.ensureConnected(), 'feedbackByte:new');
  }

  onSessionUpdate(): Observable<TestSession> {
    return fromEvent<TestSession>(this.ensureConnected(), 'session:updated');
  }

  onReconnect(): Observable<void> {
    return fromEvent<void>(this.ensureConnected(), 'connect');
  }

  private ensureConnected(): Socket {
    if (!this.socket) {
      this.socket = io(environment.wsUrl, {
        auth: { token: this.authService.getToken() },
      });
    }

    return this.socket;
  }
}
