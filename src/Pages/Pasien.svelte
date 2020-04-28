<script>
  export let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
  import { Router, Link, Route } from "svelte-routing";
  import { onMount } from 'svelte';
  import TableViewer from '../Component/TableViewer.svelte';
 
  let controller = {
      name : "pasien",
      title : "Daftar Pasien",
      sub_title : "Kelola pasien disini",
      icon      : "fa fa-address-book",
      search_selector : 1,
      button : {
        text : "Tambah Pasien",
        icon : "fa fa-plus",
        link : "tambah"
      },
      table_header : ["#", "Nama Pasien", "Alamat", "No. HP", "Tanggal Lahir", "Status", "Aksi"],
      apiUrl : apiBaseUrl + "/master_data/getAllPatients.php"
    }

</script>

<style type="scss">
  
  .page-heading{
    display: flex;
    position: relative;

    i{
      font-size: 30px;
    }
  }

  .heading-tools{
    position: absolute;
    right: 12px;
    display: flex;
    top: 50%;
    transform: translateY(-50%);
  }

</style>

<div class="container">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1></h1>
        </div>
        <div class="col-sm-6">
          <ol class="breadcrumb float-sm-right">
            <li class="breadcrumb-item"><Link to = "dashboard">Dashboard</Link></li>
            <li class="breadcrumb-item active">Pasien</li>
          </ol>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <TableViewer controller={controller} />
</div>

