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
            <li class="breadcrumb-item"><Link to = "pasien">Pasien</Link></li>
            <li class="breadcrumb-item active">Tambah Pasien</li>
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
              <h5 class="mt-1 mb-0"><i class="fas fa-plus-square mr-2"></i>Tambah Pasien</h5>
            </div>
              <!-- /.card-header -->
              <!-- form start -->
              <form role="form">
                <div class="card-body">
                  <div class="form-group">
                    <label for="patient_name important-form">Nama Pasien</label>
                    <input type="text" class="form-control" id="patient_name" placeholder="Masukkan Nama Pasien">
                  </div>
                  <div class="form-group">
                    <label for="patient_address">Alamat</label>
                    <textarea class="form-control" id="patient_address" rows="3" placeholder="Masukkan Alamat"></textarea>
                  </div>
                  <div class="form-group">
                    <label for="patient_hp">No. HP</label>
                    <input type="text" class="form-control" id="patient_hp" placeholder="Masukkan No. HP">
                  </div>
                  <div class="form-group">
                    <label for="patient_dob">Tanggal Lahir</label>
                    <div class="input-group input-group-alternative">
                      <div class="input-group-prepend">
                        <span class="input-group-text"><i class="ni ni-calendar-grid-58"></i></span>
                      </div>
                      <input class="form-control datepicker" placeholder="Pilih Tanggal Lahir" type="date" value="MM/DD/YYYY">
                    </div>
                  </div>
                </div>
                <!-- /.card-body -->

                <div class="card-footer">
                  <button type="submit" class="btn btn-primary">TAMBAHKAN PASIEN</button>
                  <Link to="pasien"><button type="submit" class="btn btn-danger">BATAL</button></Link>
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