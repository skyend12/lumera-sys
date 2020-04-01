<script>
	import { Router, Link, Route } from "svelte-routing";

  let service_data = [
    {
      id : '1',
      nama_layanan : "Slimming",
      harga        : "Rp. 300.000",
      kategori     : "Clinic"
    },
    {
      id : '2',
      nama_layanan : "Gunting + Cuci",
      harga       : "Rp. 150.000",
      kategori    : "Salon"
    }
  ];
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

<!-- Content Wrapper. Contains page content -->
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
              <li class="breadcrumb-item active">Layanan</li>
            </ol>
          </div>
        </div>
      </div><!-- /.container-fluid -->
    </section>

    <!-- Main content -->
    <section class="content">
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-12">
            <div class="card card-primary card-outline">
              <div class="card-header">
                <div class="page-heading">
                  <i class="fa fa-handshake mr-3 mt-3"></i>
                  <div>
                    <h5 class="mb-0">Daftar Layanan</h5>
                    <p class="mt-1">Kelola layanan disini</p>
                  </div>
                </div>
                <div class="heading-tools">
                  <div class="form-group mr-2">
                    <div class="input-group">
                      <input class="form-control" placeholder="Cari disini.." type="text">
                      <div class="input-group-append">
                        <span class="input-group-text"><i style="cursor: pointer;" class="fa fa-search"></i></span>
                      </div>
                    </div>
                  </div>
                  <Link to="tambahlayanan">
                    <button class="btn btn-primary btn-round btn-md">
                      <i class="fa fa-plus mr-2"></i> Tambah Layanan
                    </button>
                  </Link>
                </div>
              </div>
              <!-- /.card-header -->
              <table class="table">
                <thead>
                    <tr>
                        <th class="text-center">#</th>
                        <th>Nama Layanan</th>
                        <th>Harga</th>
                        <th>Kategori</th>
                        <th class="text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {#each service_data as service}
                      <tr>
                          <td class="text-center">{service.id}</td>
                          <td>{service.nama_layanan}</td>
                          <td>{service.harga}</td>
                          <td><span class="badge badge-success">{service.kategori}</span></td>
                          <td class="td-actions text-right">
                            <button type="button" rel="tooltip" class="btn btn-info btn-icon btn-sm " data-original-title="" title="">
                              <i class="fa fa-pencil-ruler pt-1"></i>
                            </button>
                            <button type="button" rel="tooltip" class="btn btn-danger btn-icon btn-sm " data-original-title="" title=""><i class="fa fa-trash pt-1"></i></button>
                          </td>
                      </tr>
                    {/each}
                </tbody>
              <!-- /.card-body -->

      </div><!-- /.container-fluid -->
    </section>
    <!-- /.content -->
  </div>