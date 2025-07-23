import { NgModule } from '@angular/core';

import { UsersRoutingModule } from './users-routing.module';
import { UserListComponent } from './user-list/user-list.component';
import { UserFormComponent } from './user-form/user-form.component';


@NgModule({
  imports: [
    UsersRoutingModule,
    UserListComponent,
    UserFormComponent
  ]
})
export class UsersModule { }
