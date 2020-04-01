<script>
	import { Router, Link, Route } from "svelte-routing";

  let staff_data = [
    {
      id : '1',
      nama_lengkap : "Andrew Mike",
      posisi       : "Administrator",
      status       : "aktif"
    },
    {
      id : '2',
      nama_lengkap : "John Doe",
      posisi       : "Kasir",
      status       : "aktif"
    },
    {
      id : '3',
      nama_lengkap : "Aaron Doe",
      posisi       : "Beautician",
      status       : "aktif"
    },
    {
      id : '4',
      nama_lengkap : "Bob Larsson",
      posisi       : "Stylist",
      status       : "aktif"
    },
    {
      id : '5',
      nama_lengkap : "Mimin",
      posisi       : "Hair Washer",
      status       : "aktif"
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
              <li class="breadcrumb-item active">Staf</li>
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
                  <i class="fa fa-users mr-3 mt-3"></i>
                  <div>
                    <h5 class="mb-0">Daftar Staf</h5>
                    <p class="mt-1">Kelola staf disini</p>
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
                  <Link to="tambahstaf">
                    <button class="btn btn-primary btn-round btn-md">
                      <i class="fa fa-plus mr-2"></i> Tambah Staf
                    </button>
                  </Link>
                </div>
              </div>
              <!-- /.card-header -->
              <table class="table">
                <thead>
                    <tr>
                        <th class="text-center">#</th>
                        <th>Nama Lengkap</th>
                        <th>Posisi</th>
                        <th>Status</th>
                        <th class="text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {#each staff_data as staff}
                      <tr>
                          <td class="text-center">{staff.id}</td>
                          <td>{staff.nama_lengkap}</td>
                          <td>{staff.posisi}</td>
                          <td><span class="badge badge-success">{staff.status}</span></td>
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