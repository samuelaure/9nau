// data.service.ts
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
  private databaseUrl = 'http://localhost:3333';

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get(`${this.databaseUrl}/db`);
  }

  createTransaction(transaction: any): Observable<any> {
    return this.http.post(`${this.databaseUrl}/transactions/`, transaction);
  }
  updateTransaction(index: number, transaction: any): Observable<any> {
    return this.http.put(
      `${this.databaseUrl}/transactions/${index}`,
      transaction
    );
  }

  deleteTransaction(index: number) {
    return this.http.delete(`${this.databaseUrl}/transactions/${index}`);
  }

  updateContacts(contacts: any): Observable<any> {
    return this.http.put(`${this.databaseUrl}/contacts`, contacts);
  }
}
