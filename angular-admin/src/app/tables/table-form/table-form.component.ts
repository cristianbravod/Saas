import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableService } from '../../services/table.service';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-form',
  templateUrl: './table-form.component.html',
  styleUrls: ['./table-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class TableFormComponent implements OnInit {
  tableForm: FormGroup;
  isEditMode = false;
  tableId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private tableService: TableService
  ) {
    this.tableForm = this.fb.group({
      name: ['', Validators.required],
      capacity: ['', Validators.required],
      status: ['available', Validators.required]
    });
  }

  ngOnInit(): void {
    this.tableId = this.route.snapshot.params['id'];
    if (this.tableId) {
      this.isEditMode = true;
      this.tableService.getTable(this.tableId).subscribe(table => {
        this.tableForm.patchValue(table);
      });
    }
  }

  onSubmit() {
    if (this.tableForm.valid) {
      if (this.isEditMode) {
        this.tableService.updateTable(this.tableId!, this.tableForm.value).subscribe(() => {
          this.router.navigate(['/tables']);
        });
      } else {
        this.tableService.createTable(this.tableForm.value).subscribe(() => {
          this.router.navigate(['/tables']);
        });
      }
    }
  }
}
