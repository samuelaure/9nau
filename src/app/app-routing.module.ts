import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AngularSetupComponent } from './angular-setup/angular-setup.component';
import { TransactionsComponent } from './transactions/transactions.component';

const routes: Routes = [];
const routes: Routes = [
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'angular-setup', component: AngularSetupComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
