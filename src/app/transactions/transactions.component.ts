import { Component, OnInit } from '@angular/core';
import * as bootstrap from 'bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatabaseService, Transaction } from '../../database/database.service';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  contacts: any[] = [];
  accounts: any[] = [];
  categories: any[] = [];
  newTransactionForm: FormGroup;
  showDecimals = false;
  decimalLimit = 2;
  transactionsSelected: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private databaseService: DatabaseService
    private databaseService: DatabaseService,
  ) {
    this.newTransactionForm = this.formBuilder.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      from: ['BAHUG', Validators.required],
      to: ['WOSE', Validators.required],
      concept: ['TEST CONCEPT', Validators.required],
      amount: ['333', Validators.required],
    });
  }

  ngOnInit(): void {
    this.onInit();
  }

  onInit() {
    this.databaseService.getData().subscribe((data: any) => {
      this.transactions = data.transactions.sort(
        (
          a: { date: string | number | Date },
          b: { date: string | number | Date }
        ) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        }
      );
      this.contacts = data.contacts;
      this.accounts = data.accounts;
      this.categories = data.categories;
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  calculateBalance(index: number): number {
    const transactionsSlice = this.transactions.slice(0, index + 1);
    return transactionsSlice.reduce((acc, t) => acc + t.amount, 0);
  }

  getAmountClass(value: number): string {
    const roundedValue = value >= 0 ? Math.floor(value) : Math.ceil(value);

    if (roundedValue > 0) {
      return 'text-success';
    } else if (roundedValue < 0) {
      return 'text-danger';
    } else {
      return 'text-secondary';
    }
  }

  toggleDecimals() {
    this.showDecimals = !this.showDecimals;
  }

  getRoundedAmount(value: number): string | number {
    if (!this.showDecimals) {
      const roundedValue = value >= 0 ? Math.floor(value) : Math.ceil(value);
      return Number.isInteger(roundedValue)
        ? roundedValue
        : value.toFixed(this.decimalLimit);
    }
    return value.toFixed(this.decimalLimit);
  }

  openTransactionForm() {
    const modalElement = document.getElementById('transactionModal');
    if (modalElement) {
      const transactionModal = new bootstrap.Modal(modalElement);
      transactionModal.show();
    } else {
      console.error('Modal element not found.');
    }
  }

  createNewTransaction() {
    if (this.newTransactionForm.valid) {
      const newTransaction = {
        date: new Date(this.newTransactionForm.value.date).toISOString(),
        from: this.newTransactionForm.value.from,
        to: this.newTransactionForm.value.to,
        concept: this.newTransactionForm.value.concept,
        amount: Number(this.newTransactionForm.value.amount),
      };
      console.log(new Date(this.newTransactionForm.value.date).toISOString());

      console.log(newTransaction);

      this.databaseService.createTransaction(newTransaction).subscribe(() => {
        console.log('Database updated successfully.');
        this.onInit();
      });

      this.newTransactionForm.reset({
        date: new Date().toISOString().split('T')[0],
        concept: 'TEST CONCEPT',
      });
    }
  }

  deleteTransaction(index: number) {
    this.databaseService.deleteTransaction(index).subscribe(() => {
      console.log('Database updated successfully.');
      this.onInit();
    });
  }

  checkboxChanged(event: any, index: number) {
    if (event.target.checked) {
      this.transactionsSelected.push(index);
    } else {
      this.transactionsSelected = this.transactionsSelected.filter(
        i => i !== index
      );
    }
    console.log(this.transactionsSelected);
  }

  bulkDeleteTransactions() {
    for (const index of this.transactionsSelected) {
      this.deleteTransaction(index);
    }
  }

  get fromToOptions(): { type: string; color: string; name: string }[] {
    return [
      ...this.accounts.map(a => ({
        type: 'account',
        color: 'text-primary',
        name: a.name,
      })),
      ...this.contacts.map(c => ({
        type: 'contact',
        color: 'text-danger',
        name: c.name,
      })),
      ...this.categories.map(c => ({
        type: 'category',
        color: 'text-warning',
        name: c.name,
      })),
    ];
  }

  executeFunction() {
    console.log(this.fromToOptions);
  }
}
