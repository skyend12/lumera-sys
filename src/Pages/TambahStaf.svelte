<script>
  let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
  export let id;
  import { Router, Link, Route } from "svelte-routing";
  import InputEditForm from '../Component/InputEditForm.svelte';

  let formController = {

    mode : "edit", //atau edit
    
    header : {
      title : "Tambah Staff",
      icon  : "fas fa-plus-square"
    },

    breadcrumb : [
      {
        link : "dashboard",
        value : "Dashboard"
      },
      {
        link : "staf",
        value : "Staf"
      }
    ],
    
    api : {
      apiUrl     : apiBaseUrl + "/master_data/insertEditStaff.php",
      apiRawData : apiBaseUrl + "/master_data/getAllStaff.php?id=" + id
    },

    forms : [
      {
        label : "Nama Staf",
        required : true,
        text : "",
        placeholder : "Masukan Nama Staf",
        type : "text"
      },
      {
        label : "Username",
        required : true,
        text : "",
        placeholder : "Masukan Username",
        type : "text"
      },
      {
        label : "Password",
        required : true,
        text : "",
        placeholder : "Masukan Password",
        type : "text"
      },
      {
        label : "Posisi",
        required : true,
        text : "",
        type : "select_box",
        option : ["Administrator", "Kasir"]
      },
      {
        label : "Status",
        required : true,
        text : "1",
        type : "radio",
        option : [
          {
            label : "Aktif",
            value : "1"
          },
          {
            label : "Tidak Aktif",
            value : "0"
          }
        ]
      }
    ]
  }


  if(id = undefined){
    formController.mode = "insert"
  } 
  else{
    formController.mode = "edit";
  }

</script>

<InputEditForm formController={formController} />