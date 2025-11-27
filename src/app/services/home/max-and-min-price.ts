import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface maxandmin {
  min_price: number;
  max_price: number;
}

@Injectable({
  providedIn: 'root'
})
export class MaxAndMinPrice {
  private apiUrlserve = environment.apiUrl;

  private apiUrl = `${this.apiUrlserve}/home/get_max_and_min_price`;

  constructor(private http: HttpClient) { }

  get_min_and_max_price(): Observable<maxandmin> {
    return this.http.get<maxandmin>(this.apiUrl);
  }
}
