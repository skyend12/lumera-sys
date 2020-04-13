<script>
	//import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
	import '../node_modules/argon-design-system-free/assets/css/argon.min.css';
	import '../node_modules/argon-design-system-free/assets/vendor/bootstrap-datepicker/css/bootstrap-datepicker.css';
	import Sidebar from './layout/Sidebar.svelte';
	import Staf from './Pages/Staf.svelte';
	import TambahStaf from './Pages/TambahStaf.svelte';
	import ProdukKecantikan from './Pages/Produkkecantikan.svelte';
	import TambahProdukKecantikan from './Pages/TambahProdukkecantikan.svelte';
	import Layanan from './Pages/Layanan.svelte';
	import TambahLayanan from './Pages/TambahLayanan.svelte';
	import Pasien from './Pages/Pasien.svelte';
	import TambahPasien from './Pages/TambahPasien.svelte';
	import Dashboard from './Pages/Dashboard.svelte';
	import { Router, Link, Route } from "svelte-routing";

	let containerMarginVisibletoSidebar = 250;

	function handleMessage(event) {
		containerMarginVisibletoSidebar = event.detail.text;
	}

</script>

<style type="text/css">

	.content-wrapper{
		padding-bottom: 200px;
		padding-top: 20px;
	}

	footer{
		font-size: 13px;
	}

</style>
	
<Router>
	<Sidebar on:message={handleMessage}/>

  	<div class="content-wrapper" style="margin-left: {containerMarginVisibletoSidebar}px">
  		<Route path="dashboard" component="{Dashboard}" />
    	
    	
    	<!-- layanan -->
    	<Route path="/layanan" component="{Layanan}" />
    	<Route path="/layanan/tambah" component="{TambahLayanan}" />
    	<Route path="/layanan/edit/:id" let:params>
		  <TambahLayanan id="{params.id}" />
		</Route>

		<!-- staf -->
    	<Route path="/staf" component="{Staf}" />
    	<Route path="/staf/tambah" component="{TambahStaf}" />
    	<Route path="/staf/edit/:id" let:params>
		  <TambahStaf id="{params.id}" />
		</Route>

		<!-- produk -->
    	<Route path="/produkkecantikan" component="{ProdukKecantikan}" />
    	<Route path="/produkkecantikan/tambah" component="{TambahProdukKecantikan}" />
    	<Route path="/produkkecantikan/edit/:id" let:params>
		  <TambahProdukKecantikan id="{params.id}" />
		</Route>

		<!-- pasien -->
    	<Route path="/pasien" component="{Pasien}" />
    	<Route path="/pasien/tambah" component="{TambahPasien}" />
    	<Route path="/pasien/edit/:id" let:params>
		  <TambahPasien id="{params.id}" />
		</Route>

    </div>
    
    <!-- /.content-wrapper -->
  	<footer class="main-footer" style="margin-left: {containerMarginVisibletoSidebar}px;">
    	<div class="float-right d-none d-sm-block">
      		<b>Version</b> 1.0
    	</div>
    	<strong>Copyright &copy; 2020 <a href="#">Lumera System</a>.</strong> All rights reserved.
  	</footer>
</Router>
	







			
		