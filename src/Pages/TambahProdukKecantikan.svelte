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
            <li class="breadcrumb-item"><Link to = "produkkecantikan">Produk Kecantikan</Link></li>
            <li class="breadcrumb-item active">Tambah Produk Kecantikan</li>
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
              <h5 class="mt-1 mb-0"><i class="fas fa-plus-square mr-2"></i>Tambah Produk Kecantikan</h5>
            </div>
              <!-- /.card-header -->
              <!-- form start -->
              <form role="form">
                <div class="card-body">
                  <div class="form-group">
                    <label for="barcode important-form">Barcode</label>
                    <input type="text" class="form-control" id="barcode" placeholder="Masukkan Barcode">
                  </div>
                  <div class="form-group">
                    <label for="product_name">Nama Produk Kecantikan</label>
                    <input type="text" class="form-control" id="product_name" placeholder="Masukkan Nama Produk Kecantikan">
                  </div>
                  <div class="form-group">
                    <label for="harga">Harga</label>
                    <input type="text" class="form-control" id="harga" placeholder="Masukkan Harga">
                  </div>
                </div>
                <!-- /.card-body -->

                <div class="card-footer">
                  <button type="submit" class="btn btn-primary">TAMBAHKAN PRODUK KECANTIKAN</button>
                  <Link to="produkkecantikan"><button type="submit" class="btn btn-danger">BATAL</button></Link>
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