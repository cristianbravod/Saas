import { Component, OnInit } from '@angular/core';
import { TableService } from '../../services/table.service';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-table-list',
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class TableListComponent implements OnInit {
  tables: any[] = [];

  constructor(private tableService: TableService) { }

  ngOnInit(): void {
    this.tableService.getTables().subscribe(tables => {
      this.tables = tables;
    });
  }
}
