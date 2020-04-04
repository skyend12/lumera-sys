<script>
  export let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
  import { Router, Link, Route } from "svelte-routing";
  import InputEditForm from '../Component/InputEditForm.svelte';

  let formController = {

    header : {
      title : "Tambah Layanan",
      icon  : "fas fa-plus-square"
    },

    breadcrumb : [
      {
        link : "dashboard",
        value : "Dashboard"
      },
      {
        link : "layanan",
        value : "Layanan"
      }
    ],
    
    api : {
      apiUrl : apiBaseUrl + "/master_data/insertEditServices.php"
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
        type : "number"
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

</script>

<InputEditForm formController={formController} />