import { Component, OnInit } from '@angular/core';
import { EchoService } from './services/echo.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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
