import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Emitters} from '../emitters/emitters';
import { environment } from 'src/environments/environment';
import { FileUploadService } from '../services/file-upload.service';
import { AuthService } from '../services/auth-service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  message = '';
  baseUrl!: string;
  bucket!: string;
  fileUrl!: any;
  fileObj!: File;
  uploaded = false;
  loading = false;
  newUpload = false;
  authenticated: boolean = false;
  validTypes: string[] = ['application/pdf', 'image/jpeg'];
  oldLinks!: any[];

  constructor(private http: HttpClient, private fileUploadService: FileUploadService,
    private authService: AuthService) {
    this.baseUrl = environment.serverUrl;
  }

  ngOnInit(): void {
    Emitters.reloadEmitter.subscribe(
      (reload: boolean) => {
        this.http.get(this.baseUrl + '/uploads', {withCredentials: true}).subscribe
        ((res: any) => {
            this.oldLinks = res.links;
            console.log(this.oldLinks);
            // this.
        });
      }
    );
    
    this.authService.checkAuth();
    Emitters.authEmitter.subscribe(
      (auth: boolean) => {
        this.authenticated = auth;
      }
    );
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

