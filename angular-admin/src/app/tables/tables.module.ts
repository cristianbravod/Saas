import { NgModule } from '@angular/core';

import { TablesRoutingModule } from './tables-routing.module';
import { TableListComponent } from './table-list/table-list.component';
import { TableFormComponent } from './table-form/table-form.component';


@NgModule({
  imports: [
    TablesRoutingModule,
    TableListComponent,
    TableFormComponent
  ]
})
export class TablesModule { }
