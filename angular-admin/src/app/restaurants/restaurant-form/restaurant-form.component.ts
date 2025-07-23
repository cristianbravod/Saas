import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-restaurant-form',
  templateUrl: './restaurant-form.component.html',
  styleUrls: ['./restaurant-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class RestaurantFormComponent implements OnInit {
  restaurantForm: FormGroup;
  isEditMode = false;
  restaurantId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService
  ) {
    this.restaurantForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      logo_path: [''],
      primary_color: [''],
      secondary_color: ['']
    });
  }

  ngOnInit(): void {
    this.restaurantId = this.route.snapshot.params['id'];
    if (this.restaurantId) {
      this.isEditMode = true;
      this.restaurantService.getRestaurant(this.restaurantId).subscribe(restaurant => {
        this.restaurantForm.patchValue(restaurant);
      });
    }
  }

  onSubmit() {
    if (this.restaurantForm.valid) {
      if (this.isEditMode) {
        this.restaurantService.updateRestaurant(this.restaurantId!, this.restaurantForm.value).subscribe(() => {
          this.router.navigate(['/restaurants']);
        });
      } else {
        this.restaurantService.createRestaurant(this.restaurantForm.value).subscribe(() => {
          this.router.navigate(['/restaurants']);
        });
      }
    }
  }
}
