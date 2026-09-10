import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadImageResponse {
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadsService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  uploadImage(file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadImageResponse>(
      `${this.apiUrl}/uploads`,
      formData,
    );
  }
}
