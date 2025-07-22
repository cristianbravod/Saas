import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { RestaurantsRoutingModule } from './restaurants-routing.module';
import { RestaurantListComponent } from './restaurant-list/restaurant-list.component';
import { RestaurantFormComponent } from './restaurant-form/restaurant-form.component';


@NgModule({
  declarations: [
    RestaurantListComponent,
    RestaurantFormComponent
  ],
  imports: [
    CommonModule,
    RestaurantsRoutingModule,
    ReactiveFormsModule
  ]
})
export class RestaurantsModule { }
