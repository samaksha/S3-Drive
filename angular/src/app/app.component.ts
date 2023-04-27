import { Component } from '@angular/core';
import { FileUploadService } from './file-upload.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  bucket!: string;
  fileUrl!: string;
  fileObj!: File;
  uploaded = false;
  loading = false;

  constructor(private fileUploadService: FileUploadService) {}

  onFileChange(e: Event) {
    const inputElement = e.target as HTMLInputElement;
    if (inputElement.files) {
      this.fileObj = inputElement.files[0];
    }
  }

  async onFileUpload() {
    if (!this.fileObj || !this.bucket) {
      alert('You must choose a file and bucket.');
      return;
    }

    this.loading = true;

    // Get presigned url
    this.fileUrl = await this.fileUploadService.getPresignedUrl(this.bucket);

    // Upload file
    const contentType = this.fileObj.type;
    await this.fileUploadService.uploadToS3(
      this.fileUrl,
      contentType,
      this.fileObj
    );

    this.uploaded = true;
    this.loading = false;
  }
}
