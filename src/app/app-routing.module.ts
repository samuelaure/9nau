import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AngularSetupComponent } from './angular-setup/angular-setup.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { NotesComponent } from './notes/notes.component';

const routes: Routes = [
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: '', component: NotesComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'angular-setup', component: AngularSetupComponent },
  // { path: 'detail/:id', component: HeroDetailComponent },
  // { path: 'heroes', component: HeroesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
