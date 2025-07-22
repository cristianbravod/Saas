import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private apiUrl = `${environment.apiUrl}/tables`;

  constructor(private http: HttpClient) { }

  getTables(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getTable(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createTable(table: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, table);
  }

  updateTable(id: number, table: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, table);
  }

  deleteTable(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
