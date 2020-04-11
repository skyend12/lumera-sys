<script>
  let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
  export let id;
  import { Router, Link, Route } from "svelte-routing";
  import InputEditForm from '../Component/InputEditForm.svelte';

  let formController = {

    mode : "edit", //atau edit
    
    header : {
      title : "Tambah Produk Kecantikan",
      icon  : "fas fa-plus-square"
    },

    breadcrumb : [
      {
        link : "dashboard",
        value : "Dashboard"
      },
      {
        link : "produkkecantikan",
        value : "Produk Kecantikan"
      }
    ],
    
    api : {
      apiUrl : apiBaseUrl + "/master_data/insertEditProduct.php",
      apiRawData : apiBaseUrl + "/master_data/getAllProduct.php?id=" + id
    },

    forms : [
      {
        label : "Nama Produk",
        required : true,
        text : "",
        placeholder : "Masukan Nama Produk",
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
        label : "Stok",
        required : false,
        text : "0",
        type : "text",
        disabled : true
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