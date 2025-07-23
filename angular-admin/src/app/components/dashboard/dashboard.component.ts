import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { EchoService } from '../../services/echo.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  private orderSubscription: Subscription;

  constructor(private echoService: EchoService) {
    this.orderSubscription = new Subscription();
  }

  ngOnInit(): void {
    this.orderSubscription = this.echoService.orderCreated.subscribe(order => {
      this.orders.unshift(order);
    });
  }

  ngOnDestroy(): void {
    this.orderSubscription.unsubscribe();
  }
}
