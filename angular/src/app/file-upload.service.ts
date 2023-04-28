import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment.serverUrl;
  }

  getPresignedUrl() {
    const url = `${this.baseUrl}/presigned`;
    const $resp = this.http
      .post<{ code: number; result: any }>(url, {})
      .pipe(
        map((resp) => {
          return resp.result;
        })
      );
    return lastValueFrom($resp);
  }

  uploadToS3(presignedUrl: string, contentType: string, file: File) {
    const headers = new HttpHeaders({ 'content-type': contentType });
    const $resp = this.http.put<any>(presignedUrl, file, { headers });
    return lastValueFrom($resp);
  }
}
