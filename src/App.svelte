<script>
	//import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
	import '../node_modules/argon-design-system-free/assets/css/argon.min.css';
	import Sidebar from './layout/Sidebar.svelte';
	import Staf from './Pages/Staf.svelte';
	import TambahStaf from './Pages/TambahStaf.svelte';
	import ProdukKecantikan from './Pages/Produkkecantikan.svelte';
	import TambahProdukKecantikan from './Pages/TambahProdukkecantikan.svelte';
	import Layanan from './Pages/Layanan.svelte';
	import TambahLayanan from './Pages/TambahLayanan.svelte';
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
    	<Route path="staf" component="{Staf}" />
    	<Route path="tambahstaf" component="{TambahStaf}" />
    	<Route path="produkkecantikan" component="{ProdukKecantikan}" />
    	<Route path="tambahprodukkecantikan" component="{TambahProdukKecantikan}" />
    	<Route path="layanan" component="{Layanan}" />
    	<Route path="tambahlayanan" component="{TambahLayanan}" />
    </div>
    
    <!-- /.content-wrapper -->
  	<footer class="main-footer" style="margin-left: {containerMarginVisibletoSidebar}px;">
    	<div class="float-right d-none d-sm-block">
      		<b>Version</b> 1.0
    	</div>
    	<strong>Copyright &copy; 2020 <a href="#">Lumera System</a>.</strong> All rights reserved.
  	</footer>
</Router>
	







			
		