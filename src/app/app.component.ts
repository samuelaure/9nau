import { Component } from '@angular/core';
import { DatabaseService } from 'src/database/database.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(protected databaseService: DatabaseService) { }

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
