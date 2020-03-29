<script>
	import { Router, Link, Route } from "svelte-routing";
</script>

<style type="scss">
  
  .page-heading{
    display: flex;
    position: relative;

    i{
      font-size: 30px;
    }
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
              <li class="breadcrumb-item"><Link to = "pengguna">Pengguna</Link></li>
              <li class="breadcrumb-item active">Tambah Pengguna</li>
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
                  <i class="fa fa-user-plus mr-3 mt-6 mb-0"></i>
                    <h5 class="mb-0">Tambah Pengguna</h5>
                </div>
              
              </div>
              <!-- /.card-header -->
              <!-- form start -->
              <form role="form">
                <div class="card-body">
                  <div class="form-group">
                    <label for="namalengkap">Nama Lengkap</label>
                    <input type="text" class="form-control" id="namalengkap" placeholder="Masukkan Nama Lengkap">
                  </div>
                  <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" class="form-control" id="username" placeholder="Masukkan Username">
                  </div>
                  <div class="form-group">
                    <label for="password">Password</label>
                    <input type="text" class="form-control" id="password" placeholder="Masukkan Password">
                  </div>
                  <div class="form-group">
                      <label>Posisi</label>
                        <select class="form-control">
                          <option>Administrator</option>
                          <option>Kasir</option>
                        </select>
                  </div>
                  <div class="form-group">
                    <label for="status">Status</label>
                    <div class="custom-control custom-radio mb-3">
                      <input name="radioStatus" class="custom-control-input" id="radioAktif" checked="radioAktif" type="radio">
                      <label class="custom-control-label" for="radioAktif">Aktif</label>
                    </div>
                    <div class="custom-control custom-radio mb-3">
                      <input name="radioStatus" class="custom-control-input" id="radioTidakAktif" checked="" type="radio">
                      <label class="custom-control-label" for="radioTidakAktif">Tidak Aktif</label>
                    </div>
                  </div>
                </div>
                <!-- /.card-body -->

                <div class="card-footer">
                  <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
              </form>
            </div>
            <!-- /.card -->
        </div>
        <!-- /.row -->
      </div><!-- /.container-fluid -->
    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  