import { NgModule } from '@angular/core';

import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoryListComponent } from './category-list/category-list.component';
import { CategoryFormComponent } from './category-form/category-form.component';


@NgModule({
  imports: [
    CategoriesRoutingModule,
    CategoryListComponent,
    CategoryFormComponent
  ]
})
export class CategoriesModule { }
