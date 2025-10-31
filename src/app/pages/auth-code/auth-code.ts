import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth-code',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './auth-code.html',
  styleUrl: './auth-code.css'
})
export class AuthCode {

}
