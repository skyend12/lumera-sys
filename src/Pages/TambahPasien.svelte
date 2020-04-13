<script>
  let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
  export let id;
  import { Router, Link, Route } from "svelte-routing";
  import InputEditForm from '../Component/InputEditForm.svelte';

  let formController = {

    mode : "edit", //atau edit
    
    header : {
      title : "Tambah Pasien",
      icon  : "fas fa-plus-square"
    },

    breadcrumb : [
      {
        link : "dashboard",
        value : "Dashboard"
      },
      {
        link : "pasien",
        value : "Pasien"
      }
    ],
    
    api : {
      apiUrl     : apiBaseUrl + "/master_data/insertEditPatients.php",
      apiRawData : apiBaseUrl + "/master_data/getAllPatients.php?id=" + id
    },

    forms : [
      {
        label : "Nama Pasien",
        required : true,
        text : "",
        placeholder : "Masukan Nama Pasien",
        type : "text"
      },
      {
        label : "Alamat",
        required : true,
        text : "",
        placeholder : "Masukan Alamat",
        type : "textarea"
      },
      {
        label : "No. HP",
        required : true,
        text : "",
        placeholder : "Masukan No. HP",
        type : "number"
      },
      {
        label : "Tanggal Lahir",
        required : true,
        text : "",
        type : "date"
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