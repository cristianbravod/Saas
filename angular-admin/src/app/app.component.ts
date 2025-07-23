import { Component, OnInit } from '@angular/core';
import { EchoService } from './services/echo.service';
import { AuthService } from './services/auth.service';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule]
})
export class AppComponent implements OnInit {
  title = 'angular-admin';

  constructor(
    private echoService: EchoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.echoService.init();
    }
  }
}
