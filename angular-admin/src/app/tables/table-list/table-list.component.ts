import { Component, OnInit } from '@angular/core';
import { TableService } from '../../services/table.service';

@Component({
  selector: 'app-table-list',
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.css']
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
