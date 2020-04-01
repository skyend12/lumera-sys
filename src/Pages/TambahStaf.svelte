<script>
  import { Router, Link, Route } from "svelte-routing";
</script>

<style type="scss">
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
            <li class="breadcrumb-item"><Link to = "staf">Staf</Link></li>
            <li class="breadcrumb-item active">Tambah Staf</li>
          </ol>
        </div>
      </div>
    </div>
  </section>

  <!-- Main content -->
  <section class="content">
    <div class="container-fluid">
      <div class="row">
        <!-- left column -->
        <div class="col-md-12">
          <!-- general form elements -->
          <div class="card card-primary card-outline">
            <div class="card-header">
              <h5 class="mt-1 mb-0"><i class="fas fa-user-plus mr-2"></i>Tambah Staf</h5>
            </div>
              <!-- /.card-header -->
              <!-- form start -->
              <form role="form">
                <div class="card-body">
                  <div class="form-group">
                    <label for="namaLengkap important-form">Nama Lengkap</label>
                    <input type="text" class="form-control" id="namaLengkap" placeholder="Masukkan Nama Lengkap">
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
                      <option>-PILIH-</option>
                      <option>Administrator</option>
                      <option>Kasir</option>
                      <option>Bautician</option>
                      <option>Stylist</option>
                      <option>Hair washer</option>
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
                  <button type="submit" class="btn btn-primary">TAMBAHKAN STAF</button>
                  <Link to="staf"><button type="submit" class="btn btn-danger">BATAL</button></Link>
                </div>
              </form>
              
          </div>
          <!--/.col (right) -->
        </div>
        <!-- /.row -->
      </div><!-- /.container-fluid -->
    </section>
    <!-- /.content -->
  </div>