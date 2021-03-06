import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { MyNftService } from '../service/my-nft.service';
import { MyNft } from '../interface/myNft';
import { User } from '../interface/user';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  user: User;
  myNFTs: MyNft[];
  myNewNft?: MyNft;
  isActive: boolean = false;

  selectedFile?: File;
  retrievedImages: any[];
  base64Data: any;
  retrieveResponse: any;
  message?: string;
  imageName: any;

  modalRef?: BsModalRef;

  alertMsg: string;
  visibleAlert: boolean;

  constructor( private router: Router, private authService: AuthService, private myNftService: MyNftService, private httpClient: HttpClient, private toastr: ToastrService, private modalService: BsModalService) {
    this.user = {
      mail: "",
      password: ""
    };
    this.myNFTs = new Array();
    this.retrievedImages = new Array();
    this.alertMsg = "";
    this.visibleAlert = false;
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem("currentUser") || "");
    this.getAllNft();
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['login']);
  }

  //Called when the user wants to add and nft
  public onClickForm(): void {
    this.isActive = !this.isActive;
  }

  //Called when the user selects an image
  public onFileChanged(event: any): void {
    //Select File
    this.selectedFile = event.target.files[0];
  }

  //Called to get the image of an NFT from back end
  public getImage(imageName: string, i: number): void {
    //Make a call to Spring Boot to get the Image Bytes.
    //console.log("CHIEDO 2: ", imageName);
    this.httpClient.get('http://localhost:8080/get/' + imageName)
      .subscribe((
        res: any) => {
          console.log("IMG asked: ",imageName, " IMG  received name: "+ res.name);
          this.retrieveResponse = res;
          this.base64Data = this.retrieveResponse.data;
          this.retrievedImages[i] = 'data:image/jpeg;base64,' + this.base64Data;
        }
      );
  }

  public addNft(addForm: NgForm): void {
    this.myNewNft = addForm.value;
    if(this.myNewNft) this.myNewNft.owner = this.user;

    //image
    console.log(this.selectedFile);
    
    //FormData API provides methods and properties to allow us easily prepare form data to be sent with POST HTTP requests.
    const uploadImageData = new FormData();
    const index: number = this.user.mail.indexOf('@');
    const name: string = this.user.mail.substring(0, index)+'_'+this.myNewNft!.name+'_'+this.selectedFile!.name;
    uploadImageData.append('imageFile', this.selectedFile!, name);
    
    //image saved before nft in the DB
    var isPresent: boolean = false;
    for (var nft of this.myNFTs) {
      if(nft.name == this.myNewNft!.name) isPresent = true;
    }
    if(!isPresent){
      //Make a call to the Spring Boot Application to save the image
      this.httpClient.post('http://localhost:8080/upload', uploadImageData, { observe: 'response' })
      .subscribe((response: any) => {
          if (response.status === 200) {
            this.message = 'Image uploaded successfully';
          } else {
            this.message = 'Image not uploaded successfully';
          }
          const image = {
            id: 0,  //correct id given by back end
            name: name,
            type: this.selectedFile?.type || "",
            data: this.selectedFile?.arrayBuffer
          };
          this.myNewNft!.image = image;
        if(this.myNewNft) this.myNewNft.image = image;
        //console.log("Form submitted", this.myNewNft);
        this.myNftService.addNFT(this.myNewNft!).subscribe(
          (response: MyNft) => {
            addForm.reset();
            this.onClickForm();
            this.toastr.success(this.myNewNft!.name+' has been created - PRICE: '+this.myNewNft!.price,'NFT CREATED!');
            this.myNFTs.splice(0, this.myNFTs.length);  //removeAll
            this.getAllNft();
          },
          (error: HttpErrorResponse) => {
            this.alertMsg = "<strong>WARNING</strong><br >NFT not valid - name already used";
            this.visibleAlert = true;
            console.log(error.message);
            this.onClickForm();
            addForm.reset();
            
          }
        );
        },
        (error: HttpErrorResponse) => {
          this.alertMsg = "<strong>WARNING</strong><br >IMAGE not valid";
          this.visibleAlert = true;
          console.log(error.message);
          this.onClickForm();
          addForm.reset();
        }
      );
    }//if - nft name
    else{
      this.alertMsg = "<strong>WARNING</strong><br >NFT not valid - name already used";
      this.visibleAlert = true;
      this.onClickForm();
      addForm.reset();
    }
  }

  //set alert not visible
  public onClosed(): void {
    this.visibleAlert = false;
  }

  public getAllNft(): void {
    //console.log("GetAll submitted");
    this.retrievedImages.splice(0, this.retrievedImages.length);  //removeAll images
    var mail: string = JSON.parse(localStorage.getItem("currentUser") || "").mail;
    this.myNftService.getAllNFT(mail).subscribe(
      (response: MyNft[]) => {
        for(let nft of response){
          if(!nft.isSold) this.myNFTs.push(nft);
        }
        for(let nft of response){
          if(nft.isSold) this.myNFTs.push(nft);
        }
        
        //console.log("elementi array:", this.myNFTs.length, "\n", this.myNFTs.toString());
        for(let i=0; i<this.myNFTs.length; i++){
          //console.log("Chiedo img: ", this.myNFTs[i].image.name);
          this.getImage(this.myNFTs[i].image.name, i);
        }

      },
      (error: HttpErrorResponse) => {
        console.log(error.message+"\nNFT not valid");
      }
    );
  }

  //confirm sell nft
  openConfirm(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template, {class: 'modal-sm'});
  }
  
  //decline sell nft
  decline(): void {
    this.modalRef!.hide();
  }

  public sellNft(sellNFT: MyNft): void {
    this.modalRef!.hide();
    //console.log("sellNft submitted: ", sellNFT.name);
    sellNFT.isSold = true;
    this.myNftService.updateNFT(sellNFT).subscribe(
      (response: MyNft) => {
        this.toastr.success(sellNFT.name+' sold - PRICE: ' + sellNFT.price,'NFT sold!');
        this.myNFTs.splice(0, this.myNFTs.length);  //removeAll nft
        this.getAllNft();
      },
      (error: HttpErrorResponse) => {
        console.log(error.message+"\nNft not found");
      }
    );
  }

  //not used
  public removeNft(remNFT: MyNft): void {
    this.modalRef!.hide();
    //console.log("removeNft submitted: ", remNFT.name);
    this.myNftService.deleteNFT(this.user.mail, remNFT.name).subscribe(
      (response: MyNft) => {
        this.toastr.success(remNFT.name+' selled - PRICE: '+remNFT.price,'NFT deleted!');
        this.myNFTs.splice(0, this.myNFTs.length);  //removeAll nft
        this.getAllNft();
      },
      (error: HttpErrorResponse) => {
        console.log(error.message+"\nNft not found");
      }
    );
  }

}
