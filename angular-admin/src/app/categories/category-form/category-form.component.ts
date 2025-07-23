import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CategoryFormComponent implements OnInit {
  categoryForm: FormGroup;
  isEditMode = false;
  categoryId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.params['id'];
    if (this.categoryId) {
      this.isEditMode = true;
      this.categoryService.getCategory(this.categoryId).subscribe(category => {
        this.categoryForm.patchValue(category);
      });
    }
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      if (this.isEditMode) {
        this.categoryService.updateCategory(this.categoryId!, this.categoryForm.value).subscribe(() => {
          this.router.navigate(['/categories']);
        });
      } else {
        this.categoryService.createCategory(this.categoryForm.value).subscribe(() => {
          this.router.navigate(['/categories']);
        });
      }
    }
  }
}
