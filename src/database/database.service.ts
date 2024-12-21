import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Transaction = {
  id: number;
  date: string;
  from: string;
  to: string;
  concept: string;
  amount: number;
};

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private databasePath = 'http://localhost:3333';

  constructor(private http: HttpClient) { }

  getNotes(): Observable<any> {
    return this.http.get(`${this.databasePath}/block/text/remindables`);
  }

  createNote(note: any): Observable<any> {
    return this.http.post(`${this.databasePath}/block/text`, note);
  }

  updateNote(id: string, note: any): Observable<any> {
    return this.http.patch(`${this.databasePath}/block/${id}`, note);
  }

  // getData(): Observable<any> {
  //   return this.http.get(`${this.databasePath}`);
  // }

  // getTransactions(): Observable<any> {
  //   return this.http.get(`${this.databasePath}/transactions`);
  // }

  // getContacts(): Observable<any> {
  //   return this.http.get(`${this.databasePath}/contacts`);
  // }

  // getAccounts(): Observable<any> {
  //   return this.http.get(`${this.databasePath}/accounts`);
  // }

  // getCategories(): Observable<any> {
  //   return this.http.get(`${this.databasePath}/categories`);
  // }

  // createTransaction(transaction: any): Observable<any> {
  //   return this.http.post(`${this.databasePath}/transactions/`, transaction);
  // }

  // updateTransaction(index: number, transaction: any): Observable<any> {
  //   return this.http.put(
  //     `${this.databasePath}/transactions/${index}`,
  //     transaction
  //   );
  // }

  // deleteTransaction(index: number) {
  //   return this.http.delete(`${this.databasePath}/transactions/${index}`);
  // }

  // updateContacts(contacts: any): Observable<any> {
  //   return this.http.put(`${this.databasePath}/contacts`, contacts);
  // }

  testFunction(): Observable<any> {
    return this.http.get(`${this.databasePath}/block/text/test`);
  }
}
