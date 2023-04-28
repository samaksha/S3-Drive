import { Component } from '@angular/core';
import { FileUploadService } from './file-upload.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  bucket!: string;
  fileUrl!: any;
  fileObj!: File;
  uploaded = false;
  loading = false;
  newUpload = false;
  baseUrl!: string;
  validTypes: string[] = ['application/pdf', 'image/jpeg'];

  constructor(private fileUploadService: FileUploadService) {
    this.baseUrl = environment.serverUrl;
  }

  onFileChange(e: Event) {
    const inputElement = e.target as HTMLInputElement;
    if (inputElement.files && this.validateFile(inputElement.files[0])) {
      this.fileObj = inputElement.files[0];
      this.newUpload = true;
    }
  }

  validateFile(f: File) : boolean
  {
    // return (!this.validTypes.includes(f.type) || f.size > 10e+6) ? false : true;
    if (!this.validTypes.includes(f.type)) {
      alert('File should be a pdf or a jpeg');
    } 
    else if (f.size > 10e+6) {
      alert('File is too large. Over 10MB');
    }
    else return true;
    return false;
  }

  async onFileUpload() {
    if (!this.fileObj || !this.newUpload) {
      alert('You must choose a file.');
      console.log(this.fileObj);
      return;
    }

    this.loading = true;

    // Get presigned url
    this.fileUrl = await this.fileUploadService.getPresignedUrl();

    // Upload file
    const contentType = this.fileObj.type;
    await this.fileUploadService.uploadToS3(
      this.fileUrl.presignedUrl,
      contentType,
      this.fileObj
    );
    // var fileTemp!: File;
    // this.fileObj = fileTemp;
    this.newUpload = false;
    this.uploaded = true;
    this.loading = false;
  }
}
