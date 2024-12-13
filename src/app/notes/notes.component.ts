import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatabaseService } from 'src/database/database.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  notes: any[] = [];
  notesSelected: any[] = [];

  constructor (protected databaseService: DatabaseService) {
  }
  ngOnInit(): void {
    this.onInit();
  }

  onInit() {
    this.databaseService.getNotes().subscribe(
      (data: any[]) => {
        // Ensure data is an array before calling sort
        if (data && Array.isArray(data)) {
          this.notes = data.sort(
            (a: { createdAt: string | number | Date }, b: { createdAt: string | number | Date }) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateA - dateB;
            }
          );
          console.log('this.notes', this.notes);
        } else {
          console.error('Data is not an array or is null/undefined');
          this.notes = []; // Assign an empty array if data is invalid
        }
      },
      (error) => {
        console.error('Error fetching notes:', error);
        this.notes = []; // Assign an empty array in case of error
      }
    );
    // this.databaseService.getContacts().subscribe((data: any) => {
    //   this.contacts = data;
    // });
    // this.databaseService.getAccounts().subscribe((data: any) => {
    //   this.accounts = data;
    // });
    // this.databaseService.getCategories().subscribe((data: any) => {
    //   this.categories = data;
    // });
  }
  
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  checkboxChanged(event: any, index: number) {
    if (event.target.checked) {
      this.notesSelected.push(index);
    } else {
      this.notesSelected = this.notesSelected.filter(
        i => i !== index
      );
    }
    console.log(this.notesSelected);
  }
}
