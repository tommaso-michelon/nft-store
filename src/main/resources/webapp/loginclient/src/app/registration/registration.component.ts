import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-registration-component',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {}


  submitAdd(addForm: NgForm): void{
    console.log("Form submitted", addForm.value);   //sistemare
    //document.getElementById('add-user-form').click();
    this.userService.addUser(addForm.value).subscribe(
      (response: User) => {
        addForm.reset();
        this.router.navigate(['login']);
      },
      (error: HttpErrorResponse) => {
        alert(error.message+"\nMail already registered");
        addForm.reset();
      }
    );
  }

}