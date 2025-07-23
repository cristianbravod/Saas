import { NgModule } from '@angular/core';

import { RestaurantsRoutingModule } from './restaurants-routing.module';
import { RestaurantListComponent } from './restaurant-list/restaurant-list.component';
import { RestaurantFormComponent } from './restaurant-form/restaurant-form.component';


@NgModule({
  imports: [
    RestaurantsRoutingModule,
    RestaurantListComponent,
    RestaurantFormComponent
  ]
})
export class RestaurantsModule { }
