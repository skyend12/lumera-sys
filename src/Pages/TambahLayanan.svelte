<script>
  let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
  export let id;
  import { Router, Link, Route } from "svelte-routing";
  import InputEditForm from '../Component/InputEditForm.svelte';

  let formController = {

    mode : "edit", //atau edit
    
    header : {
      title : "Tambah Layanan",
      icon  : "fas fa-plus-square"
    },

    breadcrumb : [
      {
        link : "dashboard",
        value : "dashboard"
      },
      {
        link : "layanan",
        value : "layanan"
      }
    ],
    
    api : {
      apiUrl : apiBaseUrl + "/master_data/insertEditServices.php",
      apiRawData : apiBaseUrl + "/master_data/getAllServices.php?id=" + id
    },

    forms : [
      {
        label : "Nama Layanan",
        required : true,
        text : "",
        placeholder : "Masukan Nama Layanan",
        type : "text"
      },
      {
        label : "Harga",
        required : true,
        text : "",
        placeholder : "Masukan Harga",
        type : "currency"
      },
      {
        label : "Kategori",
        required : true,
        text : "",
        type : "select_box",
        option : ["Klinik", "Salon"]
      }
      /*
      {
        label : "Status",
        required : true,
        text : 0,
        type : "radio",
        option : [
          {
            label : "Aktif",
            value : 1
          },
          {
            label : "Tidak Aktif",
            value : 0
          }
        ]
      }*/
    ]
  }


  if(id = undefined){
    formController.mode = "insert"
  } 
  else{
    formController.mode = "edit";
  }
</script>
{id}
<InputEditForm formController={formController} />