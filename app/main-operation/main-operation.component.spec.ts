import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainOperationComponent } from './main-operation.component';

describe('MainOperationComponent', () => {
  let component: MainOperationComponent;
  let fixture: ComponentFixture<MainOperationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MainOperationComponent]
    });
    fixture = TestBed.createComponent(MainOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
