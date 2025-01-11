import { Component, OnInit } from '@angular/core';
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
  habits: any[] = [];
  habitsSelected: any[] = [];
  newHabitForm: FormGroup;
  date: string = new Date().toISOString().slice(0, 10);

  constructor(protected databaseService: DatabaseService) {
    this.newNoteForm = new FormGroup({
      content: new FormControl('', Validators.required),
      writtenAt: new FormControl('', Validators.required),
      reminderFrequency: new FormControl(1, Validators.required),
    });
    this.newHabitForm = new FormGroup({
      habit: new FormControl('', Validators.required),
      reminderFrequency: new FormControl(1, Validators.required),
    });
  }

  ngOnInit(): void {
    this.onInit();
  }

  onInit() {
    this.databaseService.getBlocks('habit', this.date).subscribe(
      (data: any[]) => {
        if (data && Array.isArray(data)) {
          this.habits = data;
        } else {
          console.error('Data is not an array or is null/undefined');
          this.habits = [];
        }
      },
      (error) => {
        console.error('Error fetching habits:', error);
        this.habits = [];
      }
    );

    this.databaseService.getBlocks('text', this.date).subscribe(
      (data: any[]) => {
        if (data && Array.isArray(data)) {
          this.notes = data;
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

  createNote() {
    const { content, reminderFrequency, writtenAt } = this.newNoteForm.value;
    this.databaseService.createBlock({ type: 'text', properties: { content, writtenAt }, reminderFrequency }).subscribe(() => {
      this.newNoteForm.reset({ writtenAt: writtenAt });
      this.onInit();
    });
  }

  createHabit() {
    const { habit, reminderFrequency } = this.newHabitForm.value;
    this.databaseService.createBlock({ type: 'habit', properties: { habit }, reminderFrequency }).subscribe(() => {
      this.newHabitForm.reset();
      this.onInit();
    });
  }

  checkboxChanged(event: any, index: string) {
    if (event.target.checked) {
      this.databaseService.updateBlock(index, { remindedAt: new Date().toISOString() }).subscribe(() => {
        this.notes = this.notes.filter(note => note.id !== index);
        this.habits = this.habits.filter(habit => habit.id !== index);
      });
    } else {
      console.log('XXX');
      // this.notesSelected = this.notesSelected.filter(
      //   i => i !== index
      // );
    }
  }

  openForm(blockTypeForm: string) {
    const modalElement = blockTypeForm === 'note' ? document.getElementById('noteModal') : document.getElementById('habitModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    } else {
      console.error('Modal element not found.');
    }
  }

  changeDate(difference: number): void {
    if (typeof difference !== 'number') {
      throw new Error('Invalid difference input');
    }
    if (difference === 0) {
      this.date = new Date().toISOString().slice(0, 10);
    } else {
      const updatedDate = new Date(new Date(this.date).toISOString().slice(0, 10));
      updatedDate.setDate(updatedDate.getDate() + difference);
      this.date = updatedDate.toISOString().slice(0, 10);
    }
    this.onInit();
  }

  dateToShow(date: string): string {
    const dateToShow = new Date(date).toLocaleDateString();
    const day = new Date(date).toLocaleString('es-es', { weekday: 'long' });
    return dateToShow + ' ' + day;
  }
}
