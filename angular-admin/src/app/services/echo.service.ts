import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EchoService {
  echo: Echo;
  orderCreated = new Subject<any>();

  constructor(private authService: AuthService) { }

  init() {
    if (this.echo) {
      this.disconnect();
    }

    const token = this.authService.getToken();
    const user = this.authService.getUser();

    if (token && user) {
      this.echo = new Echo({
        broadcaster: 'pusher',
        key: environment.pusher.key,
        cluster: environment.pusher.cluster,
        forceTLS: true,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      this.echo.private(`restaurant.${user.restaurant_id}`)
        .listen('OrderCreated', (e: any) => {
          this.orderCreated.next(e.order);
        });
    }
  }

  disconnect() {
    if (this.echo) {
      this.echo.disconnect();
    }
  }
}
