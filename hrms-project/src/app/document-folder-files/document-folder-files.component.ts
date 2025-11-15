import { Component } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-document-folder-files',
  templateUrl: './document-folder-files.component.html',
  styleUrl: './document-folder-files.component.css'
})
export class DocumentFolderFilesComponent {

  documents: any[] = [];  // store fetched docs

  
  constructor(
    private sessionService: SessionService,
    private authService: AuthenticationService,
        private employeeService: EmployeeService,
        private route: ActivatedRoute,




    
    ) {
     
    }

    folderId: number | null = null;

    ngOnInit(): void {
      // 🔥 This listens every time routerLink changes the folder ID
  this.route.paramMap.subscribe(params => {
    this.folderId = Number(params.get('id'));
    console.log("Folder changed → ", this.folderId);

    this.getDocuments(); // reload documents
  });
    }

  
  isopenDocement: boolean = false;


  name: any = '';
  folder: number | null = null;

  openPopus(): void {
    this.isopenDocement = true;
  
    // Automatically set folder ID when popup opens
    this.folder = this.folderId;  
    console.log("Popup opened with folder:", this.folder);
  }

  selectedFile: File | null = null;


  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }
 

  FolderDocuments:any []=[];

// ✅ Fetch document folders from backend
loadDocumentfolders(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.employeeService.getDocuments(selectedSchema).subscribe(
      (result: any) => {
        // Filter only top-level folders (no parent)
        this.FolderDocuments = result.filter((folder: any) => folder.parent === null);
        console.log('Fetched Document :', this.FolderDocuments);
      },
      (error) => {
        console.error('Error fetching document folders:', error);
      }
    );
  }
}

 

uploadfolderDocument(): void {
  if (!this.name) {
    alert("Please enter document name.");
    return;
  }

  if (!this.folder) {
    alert("Folder not selected!");
    return;
  }

  if (!this.selectedFile) {
    alert("Please upload a document.");
    return;
  }

  const formData = new FormData();
  formData.append('name', this.name);
  formData.append('folder', this.folder.toString());
  formData.append('file', this.selectedFile);

  this.employeeService.registerDocument(formData).subscribe(
    (response) => {
      console.log('Document added:', response);
      alert('Document Uploaded Successfully');
      this.isopenDocement = false;
      this.selectedFile = null;
      this.name = '';
      this.getDocuments();
    },
    (error) => {
      console.error('Upload failed', error);
      alert('Upload failed. Try again!');
    }
  );
}
    

getDocuments(): void {
  if (!this.folderId) {
    console.error("Folder ID missing!");
    return;
  }

  this.employeeService.getDocumentsByFolder(this.folderId).subscribe(
    (data) => {
      this.documents = data;
      console.log("Fetched Documents:", this.documents);
    },
    (error) => {
      console.error("Error loading documents:", error);
    }
  );
}

}
