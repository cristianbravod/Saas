import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { TablesRoutingModule } from './tables-routing.module';
import { TableListComponent } from './table-list/table-list.component';
import { TableFormComponent } from './table-form/table-form.component';


@NgModule({
  declarations: [
    TableListComponent,
    TableFormComponent
  ],
  imports: [
    CommonModule,
    TablesRoutingModule,
    ReactiveFormsModule
  ]
})
export class TablesModule { }
