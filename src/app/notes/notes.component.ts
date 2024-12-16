import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatabaseService } from 'src/database/database.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  notes: any[] = [];
  notesSelected: any[] = [];
  newNoteForm: FormGroup;

  constructor(protected databaseService: DatabaseService) {
    this.newNoteForm = new FormGroup({
      content: new FormControl('', Validators.required),
      frequency: new FormControl(1, Validators.required),
      writtenAt: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    this.onInit();
  }

  onInit() {
    this.databaseService.getNotes().subscribe(
      (data: any[]) => {
        if (data && Array.isArray(data)) {
          this.notes = data;
          console.log('this.notes', this.notes);
        } else {
          console.error('Data is not an array or is null/undefined');
          this.notes = [];
        }
      },
      (error) => {
        console.error('Error fetching notes:', error);
        this.notes = [];
      }
    );
  }

  createNewnote() {
    const content = this.newNoteForm.value.content;
    const reminderFrequency = this.newNoteForm.value.frequency;
    const writtenAt = new Date(this.newNoteForm.value.writtenAt) || new Date();
    this.databaseService.createNote({ content, reminderFrequency, writtenAt }).subscribe(() => {
      this.newNoteForm.reset({ writtenAt: writtenAt });
      this.onInit();
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  checkboxChanged(event: any, index: string) {
    if (event.target.checked) {
      this.notesSelected.push(index);
      this.databaseService.updateNote(index, { remindedAt: new Date().toISOString() }).subscribe(() => {
        this.notes = this.notes.filter(note => note.id !== index);
      });
    } else {
      this.notesSelected = this.notesSelected.filter(
        i => i !== index
      );
    }
    console.log(this.notesSelected);
  }

  openNoteForm() {
    const modalElement = document.getElementById('noteModal');
    if (modalElement) {
      const noteModal = new bootstrap.Modal(modalElement);
      noteModal.show();
    } else {
      console.error('Modal element not found.');
    }
  }

  testFunction() {
    this.databaseService.testFunction().subscribe({
      next: (data) => {
        console.log(data);
      },
      error: (error) => {
        console.error(error);
      },
    })
  }
}
