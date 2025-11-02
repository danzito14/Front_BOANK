import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { interval, map } from 'rxjs';



@Component({
  selector: 'app-temporal',
  imports: [CommonModule],
  templateUrl: './temporal.html',
  styleUrls: ['./temporal.css', '../../app.css']
})
export class Temporal {
  hora$ = interval(1000).pipe(
    map(() => new Date().toLocaleTimeString('es-MX', { hour12: false }))
  );

}
