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
            <li class="breadcrumb-item"><Link to = "pengguna">Pengguna</Link></li>
            <li class="breadcrumb-item active">Tambah Pengguna</li>
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
          <div class="card card-primary">
            <div class="card-header bg-white">
              <h5 class="mt-1 mb-0"><i class="fas fa-user-plus mr-2"></i>Tambah Pengguna</h5>
            </div>
              <!-- /.card-header -->
              <!-- form start -->
              <form role="form">
                <div class="card-body">
                  <div class="form-group">
                    <label for="name important-form">Nama</label>
                    <input type="text" class="form-control" id="name" placeholder="Masukkan Nama">
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
                    <label>Hak Akses</label>
                    <select class="form-control">
                      <option>-PILIH-</option>
                      <option>Administrator</option>
                      <option>Kasir</option>
                    </select>
                  </div>
                   <div class="form-group">
                    <label for="password">Masukan Password Otentikasi Admin Anda</label>
                    <input type="text" class="form-control" id="password" placeholder="Masukkan Password Otentikasi">
                  </div>
                  
                </div>
                <!-- /.card-body -->

                <div class="card-footer">
                  <button type="submit" class="btn btn-primary">TAMBAHKAN PENGGUNA</button>
                  <Link to="pengguna"><button type="submit" class="btn btn-danger">BATAL</button></Link>
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